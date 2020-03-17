package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/websocket"
)

type User struct {
	room   *Room
	conn   *websocket.Conn
	sendCh chan []byte

	initialized bool
}

func newUser(room *Room, conn *websocket.Conn) *User {
	return &User{
		room:   room,
		conn:   conn,
		sendCh: make(chan []byte, 256),
	}
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
		message := Message{}
		if err := json.Unmarshal(b, &message); err != nil {
			log.Println(err)
			continue
		}
		message.user = u
		u.room.messageCh <- &message
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

func serveWs(rooms *RoomMap, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	query := r.URL.Query()
	roomID, err := strconv.Atoi(query.Get("r"))
	if err != nil {
		return
	}
	room, err := rooms.Load(roomID)
	if err == ErrRoomNotFound {
		room = newRoom(roomID)
		go func() {
			room.run()
			rooms.Delete(roomID)
		}()
		rooms.Store(roomID, room)
	}

	u := newUser(room, conn)
	room.registerCh <- u

	go u.readPump()
	go u.writePump()
}
