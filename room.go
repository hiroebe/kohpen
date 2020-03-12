package main

import (
	"errors"
	"sync"
)

type DrawInfo struct {
	user *User
	info []byte
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

type Room struct {
	id           int
	users        map[*User]bool
	registerCh   chan *User
	unregisterCh chan *User
	broadcastCh  chan *DrawInfo
}

func newRoom(id int) *Room {
	room := &Room{
		id:           id,
		users:        make(map[*User]bool),
		registerCh:   make(chan *User),
		unregisterCh: make(chan *User),
		broadcastCh:  make(chan *DrawInfo),
	}
	go room.run()
	return room
}

func (r *Room) run() {
	for {
		select {
		case user := <-r.registerCh:
			r.users[user] = true
		case user := <-r.unregisterCh:
			if _, ok := r.users[user]; ok {
				delete(r.users, user)
				close(user.sendCh)
			}
		case drawInfo := <-r.broadcastCh:
			for user := range r.users {
				if user == drawInfo.user {
					continue
				}
				select {
				case user.sendCh <- drawInfo.info:
				default:
					delete(r.users, user)
					close(user.sendCh)
				}
			}
		}
	}
}
