'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Share2, 
  Link, 
  Mail, 
  MessageCircle,
  QrCode,
  Copy,
  Check,
  Lock,
  Download,
  Users
} from 'lucide-react'
import { InsightSharingService, ShareLink } from '@/lib/sharing/insight-sharing-service'

interface ShareInsightDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  insightType: 'product' | 'supplier' | 'financial' | 'inventory' | 'full-report'
  data: any
  title?: string
}

export function ShareInsightDialog({
  open,
  onOpenChange,
  insightType,
  data,
  title = 'Share Insights'
}: ShareInsightDialogProps) {
  const [shareLink, setShareLink] = useState<ShareLink | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Share options
  const [requireAuth, setRequireAuth] = useState(false)
  const [allowDownload, setAllowDownload] = useState(false)
  const [expiresIn, setExpiresIn] = useState(7) // days
  const [password, setPassword] = useState('')
  const [allowedEmails, setAllowedEmails] = useState('')

  const sharingService = new InsightSharingService()

  const generateShareLink = async () => {
    setIsGenerating(true)
    try {
      const link = await sharingService.createShareableInsight(
        insightType,
        data,
        {
          requiresAuth: requireAuth,
          canDownload: allowDownload,
          password: password || undefined,
          allowedEmails: allowedEmails ? allowedEmails.split(',').map(e => e.trim()) : undefined
        }
      )
      setShareLink(link)
    } catch (error) {
      console.error('Failed to generate share link:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    if (shareLink?.url) {
      navigator.clipboard.writeText(shareLink.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareViaWhatsApp = () => {
    if (shareLink) {
      const message = sharingService.generateWhatsAppMessage(
        { 
          id: '', 
          type: insightType, 
          title, 
          description: '', 
          metrics: data.metrics || {}, 
          createdAt: new Date().toISOString(),
          accessCount: 0,
          permissions: { canView: true, canComment: false, canDownload: allowDownload, requiresAuth: requireAuth }
        },
        shareLink
      )
      window.open(`https://wa.me/?text=${message}`, '_blank')
    }
  }

  const shareViaEmail = () => {
    if (shareLink) {
      const emailContent = sharingService.generateEmailContent(
        { 
          id: '', 
          type: insightType, 
          title, 
          description: '', 
          metrics: data.metrics || {}, 
          createdAt: new Date().toISOString(),
          accessCount: 0,
          permissions: { canView: true, canComment: false, canDownload: allowDownload, requiresAuth: requireAuth }
        },
        shareLink
      )
      window.location.href = `mailto:?subject=${encodeURIComponent(emailContent.subject)}&body=${encodeURIComponent(emailContent.body)}`
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="options" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="share" disabled={!shareLink}>Share</TabsTrigger>
          </TabsList>

          <TabsContent value="options" className="space-y-4 mt-4">
            {/* Security Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Security & Access</h4>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="require-auth" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Require authentication
                </Label>
                <Switch
                  id="require-auth"
                  checked={requireAuth}
                  onCheckedChange={setRequireAuth}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allow-download" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Allow download
                </Label>
                <Switch
                  id="allow-download"
                  checked={allowDownload}
                  onCheckedChange={setAllowDownload}
                />
              </div>
            </div>

            {/* Advanced Options */}
            {requireAuth && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="password">Password (optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Leave empty for no password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="emails" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Allowed emails (comma-separated)
                  </Label>
                  <Input
                    id="emails"
                    placeholder="user1@example.com, user2@example.com"
                    value={allowedEmails}
                    onChange={(e) => setAllowedEmails(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Expiration */}
            <div>
              <Label htmlFor="expires">Link expires in (days)</Label>
              <Input
                id="expires"
                type="number"
                min="1"
                max="30"
                value={expiresIn}
                onChange={(e) => setExpiresIn(parseInt(e.target.value))}
                className="mt-1"
              />
            </div>

            <Button 
              onClick={generateShareLink} 
              className="w-full"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Share Link'}
            </Button>
          </TabsContent>

          <TabsContent value="share" className="space-y-4 mt-4">
            {shareLink && (
              <>
                {/* Share Link */}
                <div className="space-y-2">
                  <Label>Share Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={shareLink.url}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={copyToClipboard}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* QR Code */}
                {shareLink.qrCode && (
                  <div className="flex justify-center p-4 border rounded-lg">
                    <img src={shareLink.qrCode} alt="QR Code" className="w-32 h-32" />
                  </div>
                )}

                {/* Share Methods */}
                <div className="space-y-2">
                  <Label>Share via</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={shareViaWhatsApp}
                      className="flex items-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      onClick={shareViaEmail}
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                  </div>
                </div>

                {/* Share Info */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {requireAuth && <Badge variant="secondary">Protected</Badge>}
                    {allowDownload && <Badge variant="secondary">Downloadable</Badge>}
                  </div>
                  <p>Link expires in {expiresIn} days</p>
                  {password && <p>Password protected</p>}
                  {allowedEmails && <p>Restricted to specific emails</p>}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}