export class ICSGenerator {
  private static formatDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
  }

  private static generateUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@library-app.com`
  }

  private static createVEvent(
    title: string,
    description: string,
    startDate: Date,
    endDate: Date,
    alarmMinutes = 60,
  ): string {
    const now = new Date()
    const dtStamp = this.formatDate(now)
    const dtStart = this.formatDate(startDate)
    const dtEnd = this.formatDate(endDate)
    const uid = this.generateUID()

    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      "LOCATION:University Library",
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${title}`,
      `TRIGGER:-PT${alarmMinutes}M`,
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n")
  }

  private static createICSContent(
    title: string,
    description: string,
    startDate: Date,
    endDate: Date,
    alarmMinutes = 60,
  ): string {
    const vEvent = this.createVEvent(title, description, startDate, endDate, alarmMinutes)

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Library App//Book Reminder//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      vEvent,
      "END:VCALENDAR",
    ].join("\r\n")
  }

  private static createMultipleEventsICS(events: string[]): string {
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Library App//Book Reminders//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      ...events,
      "END:VCALENDAR",
    ].join("\r\n")
  }

  private static downloadICS(content: string, filename: string): void {
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  static generateBookReminderAndDownload(bookTitle: string, author: string, dueDate: Date): void {
    // Create reminder 3 days before due date
    const reminderDate = new Date(dueDate)
    reminderDate.setDate(reminderDate.getDate() - 3)
    reminderDate.setHours(9, 0, 0, 0) // Set to 9 AM

    const endDate = new Date(reminderDate)
    endDate.setHours(10, 0, 0, 0) // 1 hour duration

    const title = `Book Return Reminder: ${bookTitle}`
    const description = [
      `Book: ${bookTitle}`,
      `Author: ${author}`,
      `Due Date: ${dueDate.toLocaleDateString()}`,
      "",
      "This book is due in 3 days!",
      "Please return it to the library on time to avoid late fees.",
      "",
      "Location: University Library",
      "Contact: library@university.edu",
    ].join("\\n")

    const icsContent = this.createICSContent(title, description, reminderDate, endDate, 60)
    const filename = `book-reminder-${bookTitle.replace(/[^a-zA-Z0-9]/g, "-")}.ics`

    this.downloadICS(icsContent, filename)
  }

  static generateAndDownloadMultipleReminders(bookTitle: string, author: string, dueDate: Date): void {
    const reminders = [
      { days: 7, title: "Book Return Notice", urgency: "First Notice" },
      { days: 3, title: "Book Return Reminder", urgency: "Important" },
      { days: 1, title: "Book Due Tomorrow", urgency: "URGENT" },
    ]

    const events = reminders.map((reminder) => {
      const reminderDate = new Date(dueDate)
      reminderDate.setDate(reminderDate.getDate() - reminder.days)
      reminderDate.setHours(9, 0, 0, 0)

      const endDate = new Date(reminderDate)
      endDate.setHours(10, 0, 0, 0)

      const title = `${reminder.title}: ${bookTitle}`
      const description = [
        `Book: ${bookTitle}`,
        `Author: ${author}`,
        `Due Date: ${dueDate.toLocaleDateString()}`,
        `Priority: ${reminder.urgency}`,
        "",
        `This book is due in ${reminder.days} day${reminder.days !== 1 ? "s" : ""}!`,
        "Please return it to the library on time to avoid late fees.",
        "",
        "Location: University Library",
        "Contact: library@university.edu",
      ].join("\\n")

      return this.createVEvent(title, description, reminderDate, endDate, 60)
    })

    const combinedContent = this.createMultipleEventsICS(events)
    const filename = `book-reminders-${bookTitle.replace(/[^a-zA-Z0-9]/g, "-")}.ics`
    this.downloadICS(combinedContent, filename)
  }
}
