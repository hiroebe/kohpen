package main

import (
	"flag"
	"fmt"
	"net/http"
)

var (
	port = flag.Int("port", 8080, "port")
)

func main() {
	flag.Parse()

	http.Handle("/", http.FileServer(http.Dir("./web/public")))
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(w, r)
	})

	if err := http.ListenAndServe(fmt.Sprintf(":%d", *port), nil); err != nil {
		panic(err)
	}
}
