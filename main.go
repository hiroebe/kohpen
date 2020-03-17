package main

import (
	"net/http"
	"os"
)

func getPort() string {
	port := os.Getenv("PORT")
	if port == "" {
		panic("$PORT is not set")
	}
	return port
}

func main() {
	port := getPort()

	http.Handle("/", http.FileServer(http.Dir("./web/public")))
	http.Handle("/js", http.FileServer(http.Dir("./web/public/js")))
	http.Handle("/css", http.FileServer(http.Dir("./web/public/css")))
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(w, r)
	})

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		panic(err)
	}
}
