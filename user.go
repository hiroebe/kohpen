package main

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/websocket"
)

type User struct {
	room   *Room
	conn   *websocket.Conn
	sendCh chan []byte
}

func (u *User) readPump() {
	defer func() {
		u.room.unregisterCh <- u
		u.conn.Close()
	}()
	for {
		_, b, err := u.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		u.room.broadcastCh <- &DrawInfo{user: u, info: b}
	}
}

func (u *User) writePump() {
	defer func() {
		u.conn.Close()
	}()
	for {
		message, ok := <-u.sendCh
		if !ok {
			u.conn.WriteMessage(websocket.CloseMessage, []byte{})
			return
		}
		u.conn.WriteMessage(websocket.TextMessage, message)
	}
}

var upgrader = websocket.Upgrader{}

func serveWs(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	query := r.URL.Query()
	roomIDStr := query.Get("r")
	roomID, err := strconv.Atoi(roomIDStr)
	if err != nil {
		return
	}
	room, err := rooms.Load(roomID)
	if err != nil {
		room = newRoom(roomID)
		rooms.Store(roomID, room)
	}

	u := &User{
		room:   room,
		conn:   conn,
		sendCh: make(chan []byte, 256),
	}
	room.registerCh <- u

	go u.readPump()
	go u.writePump()
}
