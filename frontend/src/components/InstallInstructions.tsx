// PWA Install Instructions Component
'use client'

import { Download, Share, MoreVertical, Plus } from 'lucide-react'

interface InstallInstructionsProps {
  platform: 'ios' | 'android' | 'desktop' | 'unknown'
}

export default function InstallInstructions({ platform }: InstallInstructionsProps) {
  const instructions = {
    ios: {
      title: 'התקנה ב-iPhone/iPad',
      steps: [
        { icon: Share, text: 'לחץ על כפתור השיתוף' },
        { icon: Plus, text: 'בחר "הוסף למסך הבית"' },
        { icon: Download, text: 'לחץ "הוסף"' },
      ],
    },
    android: {
      title: 'התקנה ב-Android',
      steps: [
        { icon: MoreVertical, text: 'פתח את תפריט הדפדפן' },
        { icon: Download, text: 'בחר "התקן אפליקציה"' },
        { icon: Plus, text: 'לחץ "התקן"' },
      ],
    },
    desktop: {
      title: 'התקנה במחשב',
      steps: [
        { icon: Download, text: 'לחץ על סמל ההתקנה בשורת הכתובת' },
        { icon: Plus, text: 'בחר "התקן"' },
      ],
    },
  }

  if (platform === 'unknown') return null

  const { title, steps } = instructions[platform]

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
      <ol className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <li key={index} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 text-slate-700">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{step.text}</span>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
