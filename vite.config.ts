import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'

function receiptStoragePlugin(): Plugin {
  return {
    name: 'receipt-storage-plugin',
    configureServer(server) {
      // 1. Static serving for /receipts
      server.middlewares.use('/receipts', (req, res, next) => {
        try {
          const receiptsDir = path.resolve(process.cwd(), 'receipts')
          const relativePath = decodeURIComponent((req.url || '').split('?')[0])
          const fullPath = path.join(receiptsDir, relativePath)

          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            const ext = path.extname(fullPath).toLowerCase()
            const mimeTypes: Record<string, string> = {
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.webp': 'image/webp',
              '.svg': 'image/svg+xml',
              '.pdf': 'application/pdf',
            }
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
            res.setHeader('Content-Disposition', 'inline')
            fs.createReadStream(fullPath).pipe(res)
            return
          }
        } catch (e) {
          console.error('Error serving receipt:', e)
        }
        next()
      })

      // 2. Upload endpoint: POST /api/upload-receipt
      server.middlewares.use('/api/upload-receipt', (req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const payload = JSON.parse(body)
              const { businessName, date, transactionName, base64Data, originalFileName } = payload

              // Business Name -> Year -> Month -> File Name
              const safeBusiness = (businessName || 'Business')
                .replace(/[^a-zA-Z0-9_\-]/g, '_')
                .trim() || 'Business'
              
              const txDate = new Date(date || Date.now())
              const year = String(txDate.getFullYear() || new Date().getFullYear())
              const month = String(txDate.getMonth() + 1).padStart(2, '0')

              const ext = path.extname(originalFileName || 'receipt.png') || '.png'
              const safeTxName = (transactionName || 'transaction')
                .replace(/[^a-zA-Z0-9_\-]/g, '_')
                .replace(/_+/g, '_')
                .substring(0, 50)

              const fileName = `${safeTxName}_${Date.now()}${ext}`

              // Target directory: receipts / business / year / month
              const targetDir = path.resolve(process.cwd(), 'receipts', safeBusiness, year, month)
              fs.mkdirSync(targetDir, { recursive: true })

              const targetFilePath = path.join(targetDir, fileName)
              const base64Content = base64Data.replace(/^data:[a-zA-Z0-9\/\-+.]+;base64,/, '')
              fs.writeFileSync(targetFilePath, Buffer.from(base64Content, 'base64'))

              const webUrl = `/receipts/${encodeURIComponent(safeBusiness)}/${year}/${month}/${fileName}`

              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  success: true,
                  filePath: targetFilePath,
                  url: webUrl,
                  fileName,
                })
              )
            } catch (err: any) {
              console.error('Upload receipt failed:', err)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          })
          return
        }

        res.statusCode = 405
        res.end()
      })

      // 3. Open receipt in native Windows photo viewer / Explorer
      server.middlewares.use('/api/open-receipt', (req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const { filePath, showInFolder } = JSON.parse(body)
              const cleanPath = path.resolve(filePath || '')
              if (cleanPath && fs.existsSync(cleanPath)) {
                if (showInFolder) {
                  const psArg = cleanPath.replace(/'/g, "''")
                  exec(`powershell -NoProfile -Command "Start-Process explorer.exe -ArgumentList '/select,\\\"${psArg}\\\"'"`, (err) => {
                    if (err) console.error('Explorer error:', err)
                  })
                } else {
                  exec(`cmd.exe /c start "" "${cleanPath}"`, (cmdErr) => {
                    if (cmdErr) {
                      const psPath = cleanPath.replace(/'/g, "''")
                      exec(`powershell -NoProfile -Command "Start-Process -FilePath '${psPath}'"`)
                    }
                  })
                }
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: true }))
                return
              }
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: false, error: 'File not found on disk: ' + cleanPath }))
            } catch (err: any) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          })
          return
        }

        res.statusCode = 405
        res.end()
      })

      // 4. Delete receipt endpoint: POST /api/delete-receipt
      server.middlewares.use('/api/delete-receipt', (req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const { filePath } = JSON.parse(body)
              const cleanPath = path.resolve(filePath || '')
              const receiptsBase = path.resolve(process.cwd(), 'receipts')
              if (cleanPath && cleanPath.startsWith(receiptsBase) && fs.existsSync(cleanPath)) {
                fs.unlinkSync(cleanPath)
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: true }))
                return
              }
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: false, message: 'File not found or outside receipts base' }))
            } catch (err: any) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          })
          return
        }

        res.statusCode = 405
        res.end()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true, // Exposes the server on local network (192.168.1.4:5173) for Android devices
    port: 5173,
  },
  plugins: [
    tailwindcss(),
    react(),
    receiptStoragePlugin(),
  ],
})
