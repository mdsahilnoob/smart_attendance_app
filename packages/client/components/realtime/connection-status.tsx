"use client"

import { useState, useEffect } from "react"
import { useSocket } from "@/lib/socket"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false)
  const { connect } = useSocket()

  useEffect(() => {
    const socket = connect()

    if (socket) {
      setIsConnected(socket.connected)

      socket.on("connect", () => {
        setIsConnected(true)
      })

      socket.on("disconnect", () => {
        setIsConnected(false)
      })

      return () => {
        socket.off("connect")
        socket.off("disconnect")
      }
    }
  }, [])

  return (
    <Badge variant={isConnected ? "default" : "destructive"} className="fixed bottom-4 right-4 z-50">
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3 mr-1" />
          Connected
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 mr-1" />
          Disconnected
        </>
      )}
    </Badge>
  )
}
