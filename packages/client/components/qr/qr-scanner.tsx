"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiCall } from "@/lib/auth"
import { Camera, CameraOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface QRScannerProps {
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
}

export function QRScanner({ onSuccess, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
        setError("")
      }
    } catch (err) {
      setError("Camera access denied or not available")
      console.error("Camera error:", err)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const markAttendance = async (qrCode: string) => {
    if (!qrCode.trim()) {
      setError("Please enter a valid QR code")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await apiCall("/api/attendance/mark-qr", {
        method: "POST",
        body: JSON.stringify({ qrCode: qrCode.trim() }),
      })

      setResult(response.data)
      setManualCode("")
      stopCamera()

      if (onSuccess) {
        onSuccess(response.data)
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to mark attendance"
      setError(errorMessage)

      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    markAttendance(manualCode)
  }

  // Simulate QR code detection (in a real app, you'd use a QR code library)
  const simulateQRDetection = () => {
    // This is a placeholder - in a real implementation, you'd use a library like
    // react-qr-reader or jsQR to detect QR codes from the video stream
    const mockQRCode = "attendance_session_" + Date.now()
    markAttendance(mockQRCode)
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  if (result) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Attendance Marked!
          </CardTitle>
          <CardDescription>Your attendance has been successfully recorded</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="font-medium">Status: {result.status}</p>
            <p className="text-sm text-muted-foreground">Time: {new Date(result.timestamp).toLocaleString()}</p>
          </div>
          <Button
            onClick={() => {
              setResult(null)
              setError("")
            }}
            className="w-full"
          >
            Mark Another Attendance
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Mark Attendance</CardTitle>
        <CardDescription>Scan QR code or enter code manually</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Camera Scanner */}
        <div className="space-y-4">
          <div className="text-center">
            {!isScanning ? (
              <Button onClick={startCamera} className="w-full">
                <Camera className="mr-2 h-4 w-4" />
                Start Camera Scanner
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-64 bg-black rounded-lg object-cover" />
                  <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-lg"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={stopCamera} variant="outline" className="flex-1 bg-transparent">
                    <CameraOff className="mr-2 h-4 w-4" />
                    Stop Camera
                  </Button>
                  <Button onClick={simulateQRDetection} className="flex-1" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Simulate Scan"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manual Entry */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
          </div>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qrCode">QR Code</Label>
            <Input
              id="qrCode"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter QR code manually"
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !manualCode.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Marking Attendance...
              </>
            ) : (
              "Mark Attendance"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
