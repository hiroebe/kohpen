package main

import (
	"encoding/json"
	"errors"
	"log"
	"sync"
)

type Message struct {
	Method string      `json:"method"`
	Data   interface{} `json:"data"`

	user *User
}

var rooms = RoomMap{}

type RoomMap struct {
	m sync.Map
}

func (m *RoomMap) Store(key int, value *Room) {
	m.m.Store(key, value)
}

func (m *RoomMap) Load(key int) (*Room, error) {
	v, ok := m.m.Load(key)
	if !ok {
		return nil, errors.New("not found")
	}
	r, ok := v.(*Room)
	if !ok {
		return nil, errors.New("invalid type")
	}
	return r, nil
}

func (m *RoomMap) Delete(key int) {
	m.m.Delete(key)
}

type Room struct {
	id           int
	users        map[*User]bool
	registerCh   chan *User
	unregisterCh chan *User
	messageCh    chan *Message
}

func newRoom(id int) *Room {
	room := &Room{
		id:           id,
		users:        make(map[*User]bool),
		registerCh:   make(chan *User),
		unregisterCh: make(chan *User),
		messageCh:    make(chan *Message),
	}
	go room.run()
	return room
}

func (r *Room) run() {
loop:
	for {
		select {
		case user := <-r.registerCh:
			user.initialized = false
			if len(r.users) == 0 {
				user.initialized = true
			}
			r.users[user] = true

		case user := <-r.unregisterCh:
			if _, ok := r.users[user]; !ok {
				continue loop
			}
			delete(r.users, user)
			close(user.sendCh)
			if len(r.users) == 0 {
				rooms.Delete(r.id)
				break loop
			}

		case message := <-r.messageCh:
			b, err := json.Marshal(message)
			if err != nil {
				log.Println(err)
				break
			}

			switch message.Method {
			case "draw", "clear":
				for user := range r.users {
					if !user.initialized || user == message.user {
						continue
					}
					r.sendToChan(user, b)
				}
			case "history-request":
				for user := range r.users {
					if !user.initialized {
						continue
					}
					if ok := r.sendToChan(user, b); ok {
						break
					}
				}
			case "history-response":
				for user := range r.users {
					if user.initialized {
						continue
					}
					if ok := r.sendToChan(user, b); ok {
						user.initialized = true
					}
				}
			default:
				log.Println("unknown method:", message)
			}

		}
	}
}

func (r *Room) sendToChan(user *User, data []byte) bool {
	select {
	case user.sendCh <- data:
		return true
	default:
		delete(r.users, user)
		close(user.sendCh)
		return false
	}
}
