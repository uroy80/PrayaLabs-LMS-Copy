// Simple QR Code generator utility
export class QRCodeGenerator {
  private static readonly QR_API_URL = "https://api.qrserver.com/v1/create-qr-code/"

  static generateQRCodeURL(data: string, size = 200): string {
    const params = new URLSearchParams({
      size: `${size}x${size}`,
      data: data,
      format: "svg",
      margin: "10",
      color: "1e3a8a",
      bgcolor: "ffffff",
    })

    return `${this.QR_API_URL}?${params.toString()}`
  }

  static async generateQRCodeDataURL(data: string, size = 200): Promise<string> {
    try {
      const url = this.generateQRCodeURL(data, size)
      const response = await fetch(url)
      const svgText = await response.text()
      const blob = new Blob([svgText], { type: "image/svg+xml" })
      return URL.createObjectURL(blob)
    } catch (error) {
      console.error("Failed to generate QR code:", error)
      return ""
    }
  }
}
