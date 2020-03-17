package main

import (
	"sync"
	"testing"
)

func TestRoomMap(t *testing.T) {
	rooms := RoomMap{}
	for i := 1; i <= 2; i++ {
		i := i
		go func() {
			room := newRoom(i)
			rooms.Store(i, room)
			loaded, err := rooms.Load(i)
			if err != nil {
				t.Fatal(err)
			}
			if loaded != room {
				t.Errorf("Wrong room loaded: got %p, want %p", loaded, room)
			}
			rooms.Delete(i)
			if _, err := rooms.Load(i); err != ErrRoomNotFound {
				t.Errorf("Wrong error occured: got %v, want %v", err, ErrRoomNotFound)
			}
		}()
	}
}

func TestRoomUnregister(t *testing.T) {
	rooms := RoomMap{}
	room := newRoom(1)

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		room.run()
		rooms.Delete(1)
		wg.Done()
	}()

	rooms.Store(1, room)
	if _, err := rooms.Load(1); err != nil {
		t.Fatal(err)
	}

	user := newUser(room, nil)
	room.registerCh <- user
	room.unregisterCh <- user
	wg.Wait()
	if _, err := rooms.Load(1); err != ErrRoomNotFound {
		t.Errorf("Wrong error occured: got %v, want %v", err, ErrRoomNotFound)
	}
}
