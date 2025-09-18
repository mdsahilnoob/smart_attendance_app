"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiCall } from "@/lib/auth"
import { QrCode, Clock, Users, Loader2, Copy, CheckCircle } from "lucide-react"

interface QRGeneratorProps {
  classId: string
  courseCode: string
  courseName: string
}

interface QRSession {
  qrCode: string
  expiresAt: string
  duration: number
  class: {
    id: string
    courseName: string
    courseCode: string
  }
}

export function QRGenerator({ classId, courseCode, courseName }: QRGeneratorProps) {
  const [session, setSession] = useState<QRSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const generateQR = async (duration = 30) => {
    setLoading(true)
    setError("")

    try {
      const response = await apiCall("/api/qr/generate", {
        method: "POST",
        body: JSON.stringify({
          classId,
          duration,
        }),
      })

      setSession(response.data)
    } catch (err: any) {
      setError(err.message || "Failed to generate QR code")
    } finally {
      setLoading(false)
    }
  }

  const endSession = async () => {
    if (!session) return

    setLoading(true)
    try {
      await apiCall("/api/qr/deactivate", {
        method: "POST",
        body: JSON.stringify({
          qrCode: session.qrCode,
        }),
      })

      setSession(null)
    } catch (err: any) {
      setError(err.message || "Failed to end session")
    } finally {
      setLoading(false)
    }
  }

  const copyQRCode = async () => {
    if (!session) return

    try {
      await navigator.clipboard.writeText(session.qrCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy QR code:", err)
    }
  }

  const getTimeRemaining = () => {
    if (!session) return null

    const now = new Date().getTime()
    const expires = new Date(session.expiresAt).getTime()
    const remaining = expires - now

    if (remaining <= 0) return "Expired"

    const minutes = Math.floor(remaining / (1000 * 60))
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code Generator
        </CardTitle>
        <CardDescription>
          Generate QR codes for {courseName} ({courseCode})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!session ? (
          <div className="text-center space-y-4">
            <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center mx-auto">
              <div className="text-center">
                <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No active session</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select session duration:</p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" onClick={() => generateQR(15)} disabled={loading}>
                  15 min
                </Button>
                <Button size="sm" onClick={() => generateQR(30)} disabled={loading}>
                  30 min
                </Button>
                <Button size="sm" onClick={() => generateQR(60)} disabled={loading}>
                  60 min
                </Button>
              </div>
            </div>

            <Button onClick={() => generateQR(30)} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Start Attendance Session"
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            {/* QR Code Display */}
            <div className="bg-white p-6 rounded-lg inline-block shadow-sm">
              <div className="w-48 h-48 bg-gray-900 text-white flex items-center justify-center text-xs font-mono break-all p-2">
                {session.qrCode}
              </div>
            </div>

            {/* Session Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="default" className="bg-green-500">
                  Active Session
                </Badge>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {getTimeRemaining()}
                </Badge>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Session expires: {new Date(session.expiresAt).toLocaleString()}</p>
                <p>Duration: {session.duration} minutes</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={copyQRCode} size="sm">
                {copied ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Code
                  </>
                )}
              </Button>
              <Button variant="destructive" onClick={endSession} disabled={loading} size="sm">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "End Session"}
              </Button>
            </div>

            {/* Instructions */}
            <div className="bg-muted p-4 rounded-lg text-left">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Instructions for Students:
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>1. Open the attendance app on your device</li>
                <li>2. Tap "Mark Attendance" or scan QR code</li>
                <li>3. Point camera at the QR code above</li>
                <li>4. Wait for confirmation message</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
