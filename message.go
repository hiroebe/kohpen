package main

type Message struct {
	Method string      `json:"method"`
	Data   interface{} `json:"data"`

	user *User
}
