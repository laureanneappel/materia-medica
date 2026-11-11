// Extracts the text of a PDF using macOS PDFKit (no extra installs needed).
// Usage: swift tools/pdf-to-text.swift "Egenskaber, redigeret  21.9.26.pdf" > out.txt
import PDFKit

guard CommandLine.arguments.count > 1,
      let doc = PDFDocument(url: URL(fileURLWithPath: CommandLine.arguments[1])) else {
    FileHandle.standardError.write("Could not open PDF\n".data(using: .utf8)!)
    exit(1)
}
for i in 0..<doc.pageCount {
    print("=== PAGE \(i + 1) ===")
    print(doc.page(at: i)?.string ?? "")
}
