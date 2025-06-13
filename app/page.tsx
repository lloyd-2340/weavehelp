"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import {
  Send,
  Search,
  Shield,
  FileText,
  Users,
  Building,
  Clock,
  Mic,
  Sun,
  Moon,
  Settings,
  X,
  User,
  LogOut,
  Paperclip,
  ArrowLeft,
  ArrowRight,
} from "lucide-react"
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  category?: string
  confidence?: number
  relatedTopics?: string[]
  isStreaming?: boolean
  streamedContent?: string
  attachments?: {
    name: string
    type: string
    size: string
  }[]
}

interface QuickAccess {
  id: string
  name: string
  icon: any
  color: string
  question: string
  responses: string[]
  followUpSuggestions: string[]
}

interface SuggestionButton {
  id: string
  text: string
  category: string
}

// Add custom animation keyframes at the top of the file
const customAnimations = `
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes glow {
  0%, 100% { text-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
  50% { text-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
}

@keyframes slideIn {
  0% { 
    opacity: 0;
    transform: translateY(20px);
  }
  100% { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  0% { 
    opacity: 0;
    transform: scale(0.95);
  }
  100% { 
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes wave {
  0%, 100% { transform: translateY(0); }
  25% { transform: translateY(-2px); }
  75% { transform: translateY(2px); }
}

.wavy-text span {
  display: inline-block;
  animation: wave 2s ease-in-out infinite;
}
`;

export default function WeaveHelp() {
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [chatStarted, setChatStarted] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestionButton[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { theme, setTheme } = useTheme()

  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const [threadId, setThreadId] = useState<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (chatStarted) {
      inputRef.current?.focus()
    }
  }, [chatStarted])

  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === "assistant" && lastMessage.isStreaming) {
      let currentIndex = 0
      const content = lastMessage.content
      const intervalId = setInterval(() => {
        if (currentIndex <= content.length) {
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages]
            updatedMessages[updatedMessages.length - 1] = {
              ...lastMessage,
              streamedContent: content.substring(0, currentIndex),
            }
            return updatedMessages
          })
          currentIndex++
        } else {
          clearInterval(intervalId)
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages]
            updatedMessages[updatedMessages.length - 1] = {
              ...lastMessage,
              isStreaming: false,
              streamedContent: content,
            }
            return updatedMessages
          })

          // Fetch dynamic suggestions based on the full chat context
          try {
            // const fetchSuggestions = async () => {
            //   const res = await fetch("/api/suggestions", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({ messages: messages }), // Send full chat history
            //   });
            //   const data = await res.json();
            //   if (data.suggestions) {
            //     const formattedSuggestions = data.suggestions.map((text: string) => ({
            //       id: text.replace(/\W+/g, '-').toLowerCase(), // Generate a simple ID
            //       text: text,
            //       category: "Suggestion",
            //     }));
            //     setSuggestions(formattedSuggestions);
            //   }
            // };
            // fetchSuggestions();
          } catch (err) {
            console.error("Error fetching suggestions:", err);
            // Optionally set some default fallback suggestions here
          }
        }
      }, 20) // Speed of typing effect

      return () => clearInterval(intervalId)
    }
  }, [messages])

  useEffect(() => {
    const container = suggestionsRef.current;
    if (!container) return;

    const updateArrowVisibility = () => {
      const { scrollWidth, clientWidth, scrollLeft } = container;
      const isOverflowing = scrollWidth > clientWidth;
      
      setShowLeftArrow(isOverflowing && scrollLeft > 0);
      setShowRightArrow(isOverflowing && scrollLeft < scrollWidth - clientWidth);
    };

    // Initial check and update on resize or scroll
    updateArrowVisibility();
    container.addEventListener('scroll', updateArrowVisibility);
    window.addEventListener('resize', updateArrowVisibility);

    // Clean up event listeners
    return () => {
      container.removeEventListener('scroll', updateArrowVisibility);
      window.removeEventListener('resize', updateArrowVisibility);
    };
  }, [suggestions]);

  if (!mounted) {
    return <div />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() && !fileInputRef.current?.files?.length) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsThinking(true)
    setChatStarted(true)
    setSuggestions([]) // Clear previous suggestions

    // Start both requests in parallel
    const llamaPromise = fetch("/api/llama-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(threadId ? { prompt: input, threadId } : { prompt: input }),
    }).then(res => res.json())

    // const suggestionsPromise = fetch("/api/suggestions", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ messages: [...messages, userMessage] }),
    // }).then(res => res.json())

    // Handle Llama response as soon as it's ready
    llamaPromise.then(data => {
      if (data.threadId) setThreadId(data.threadId);
      const newContent = data.response ?? data.error ?? "No response";
      setMessages((prev) => {
        // Prevent duplicate consecutive assistant messages
        if (
          prev.length > 0 &&
          prev[prev.length - 1].role === "assistant" &&
          prev[prev.length - 1].content.trim() === newContent.trim()
        ) {
          return prev; // Don't add duplicate
        }
        return [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            content: newContent,
            role: "assistant",
            timestamp: new Date(),
          },
        ];
      });
      setIsThinking(false);
    }).catch(err => {
      console.error("Error contacting LlamaIndex.", err)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: "Error contacting LlamaIndex.",
          role: "assistant",
          timestamp: new Date(),
        },
      ])
      setIsThinking(false)
    })

    // Handle suggestions as soon as they're ready
    // suggestionsPromise.then(data => {
    //   if (data.suggestions && Array.isArray(data.suggestions)) {
    //     setSuggestions(
    //       data.suggestions.map((text: string, idx: number) => ({
    //         id: `dynamic-${idx}`,
    //         text,
    //         category: "Dynamic"
    //       }))
    //     )
    //   } else {
    //     setSuggestions([])
    //   }
    // }).catch(err => {
    //   console.error("Error fetching suggestions.", err)
    //   setSuggestions([])
    // })
  }

  const handleQuickAccessClick = (quickAccess: QuickAccess) => {
    setInput(quickAccess.question)
    handleSubmit({ preventDefault: () => {} } as React.FormEvent)
  }

  const handleSuggestionClick = (suggestion: SuggestionButton) => {
    setInput(suggestion.text)
    handleSubmit({ preventDefault: () => {} } as React.FormEvent)
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleVoiceInput = () => {
    if (!isRecording) {
      setIsRecording(true)
      // In a real app, we would start recording here
      setTimeout(() => {
        setIsRecording(false)
        setInput("What are our company's remote work policies?")
      }, 2000)
    } else {
      setIsRecording(false)
      // In a real app, we would stop recording here
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  const generateSuggestions = (category: string): SuggestionButton[] => {
    const matchedQuickAccess = quickAccessQuestions.find((qa) => qa.name === category)

    if (matchedQuickAccess) {
      return matchedQuickAccess.followUpSuggestions.slice(0, 3).map((suggestion, index) => ({
        id: `${category}-${index}`,
        text: suggestion,
        category: category,
      }))
    }

    return [
      { id: "default-1", text: "How do I access the employee handbook?", category: "General" },
      { id: "default-2", text: "What training programs are available?", category: "General" },
      { id: "default-3", text: "Who do I contact for IT support?", category: "General" },
    ]
  }

  const quickAccessQuestions: QuickAccess[] = [
    {
      id: "1",
      name: "Company Policies",
      icon: Building,
      color: "bg-blue-500",
      question: "What are our company policies?",
      responses: [
        "Here are our key company policies:\n\n**Remote Work Policy:**\n• Work from home up to 3 days per week\n• Core collaboration hours: 10 AM - 3 PM\n• Manager approval required for flexible scheduling\n\n**Dress Code:**\n• Business casual in office\n• Professional attire for client meetings\n• Casual Fridays allowed\n\n**Communication Guidelines:**\n• Respond to emails within 24 hours\n• Use Slack for quick team communication\n• Schedule meetings through Outlook calendar\n\n**Code of Conduct:**\n• Treat all colleagues with respect\n• Maintain confidentiality of company information\n• Report any violations to HR immediately",
      ],
      followUpSuggestions: [
        "What's the dress code for client meetings?",
        "How do I request flexible work arrangements?",
        "What are the core collaboration hours?",
        "How do I report a policy violation?",
        "Can I work remotely full-time?",
      ],
    },
    {
      id: "2",
      name: "Security",
      icon: Shield,
      color: "bg-red-500",
      question: "Tell me about security policies",
      responses: [
        "Our comprehensive security policies include:\n\n**Account Security:**\n• Two-Factor Authentication (2FA) required for all company accounts\n• Password minimum: 12 characters with special characters, numbers, and mixed case\n• Password changes required every 90 days\n• No sharing of credentials under any circumstances\n\n**Remote Access:**\n• VPN connection mandatory for all remote work\n• Only company-approved devices for accessing work systems\n• Automatic screen lock after 10 minutes of inactivity\n\n**Data Protection:**\n• All sensitive data must be encrypted\n• No storing company data on personal devices\n• Use company-approved cloud storage only\n\n**Incident Reporting:**\n• Report security incidents within 1 hour\n• Contact IT Security team immediately: security@company.com\n• Document all suspicious activities",
      ],
      followUpSuggestions: [
        "How do I set up 2FA?",
        "Which VPN should I use?",
        "What apps are approved for file storage?",
        "How do I report a security incident?",
        "Can I use my personal laptop for work?",
      ],
    },
    {
      id: "3",
      name: "HR Benefits",
      icon: Users,
      color: "bg-green-500",
      question: "What HR benefits do we have?",
      responses: [
        "Our comprehensive benefits package includes:\n\n**Health & Wellness:**\n• Medical insurance with 80% company coverage\n• Dental and vision plans included\n• $500 annual wellness stipend\n• Mental health support through EAP program\n• Gym membership reimbursement up to $100/month\n\n**Financial Benefits:**\n• 401(k) with 6% company matching\n• Stock options for eligible employees\n• Flexible Spending Account (FSA)\n• Commuter benefits up to $250/month\n\n**Time Off & Leave:**\n• 20 days PTO + 10 sick days annually\n• 12 weeks paid parental leave\n• 12 company holidays\n• Sabbatical program after 5 years\n\n**Professional Development:**\n• $2,000 annual learning budget\n• Conference attendance support\n• Tuition reimbursement up to $5,000/year\n• Internal mentorship programs",
      ],
      followUpSuggestions: [
        "How do I enroll in health insurance?",
        "What's the 401k vesting schedule?",
        "How do I use my learning budget?",
        "When can I take parental leave?",
        "How do I apply for tuition reimbursement?",
      ],
    },
    {
      id: "4",
      name: "Leave",
      icon: Clock,
      color: "bg-purple-500",
      question: "How do I request time off?",
      responses: [
        "Here's everything about requesting time off:\n\n**PTO Request Process:**\n1. Log into Workday HR portal\n2. Navigate to 'Time Off' section\n3. Select leave type (vacation, personal, sick)\n4. Choose your dates\n5. Add notes if necessary\n6. Submit for manager approval\n\n**Leave Types & Allowances:**\n• **Vacation:** 20 days annually\n• **Sick Leave:** 10 days annually\n• **Personal Days:** 3 days annually\n• **Bereavement:** 5 days for immediate family\n• **Jury Duty:** Unlimited (with documentation)\n\n**Important Guidelines:**\n• Submit requests 2 weeks in advance for planned leave\n• Emergency leave can be requested same-day with manager approval\n• Unused PTO up to 5 days carries over to next year\n• Sick leave doesn't carry over\n\n**Approval Timeline:**\n• Most requests approved within 48 hours\n• Holiday periods may require earlier submission\n• Check team calendar for conflicts before requesting",
      ],
      followUpSuggestions: [
        "How do I check my PTO balance?",
        "What's the holiday schedule for this year?",
        "Can I take unpaid leave?",
        "How do I request emergency time off?",
        "What happens to unused PTO?",
      ],
    },
    {
      id: "5",
      name: "Documentation",
      icon: FileText,
      color: "bg-orange-500",
      question: "Where is project documentation?",
      responses: [
        "Here's where to find all company documentation:\n\n**Project Documentation:**\n• **Confluence:** Technical documentation and project specs\n• **SharePoint:** Department-specific documents and templates\n• **GitHub Enterprise:** Code repositories and technical docs\n• **Figma:** Design files and UI/UX documentation\n\n**HR & Company Documents:**\n• **Employee Handbook:** Available in Workday\n• **Policy Documents:** Company intranet under 'Policies'\n• **Org Charts:** Workday directory\n• **Forms & Templates:** SharePoint 'Resources' folder\n\n**Access & Permissions:**\n• Role-based access automatically assigned\n• Request additional access through IT Help Desk\n• Team leads can grant project-specific permissions\n• All documents searchable through company search portal\n\n**Document Guidelines:**\n• Keep all work documents in approved company systems\n• Use version control for collaborative documents\n• Follow naming conventions for easy discovery\n• Regular backups performed automatically",
      ],
      followUpSuggestions: [
        "How do I access Confluence?",
        "Where do I find the employee handbook?",
        "Who can give me GitHub access?",
        "How do I search for company documents?",
        "Where are the HR forms located?",
      ],
    },
  ]

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "bg-[#121212]" : "bg-gray-50"} flex flex-col relative`}
    >
      {/* Add custom animations */}
      <style>{customAnimations}</style>
      <style>{`
        .assistant-markdown, .assistant-markdown * {
          ${theme === "dark"
            ? `color: #fff !important;
               --tw-prose-body: #fff !important;
               --tw-prose-headings: #fff !important;
               --tw-prose-links: #fff !important;
               --tw-prose-bold: #fff !important;
               --tw-prose-counters: #fff !important;
               --tw-prose-bullets: #fff !important;
               --tw-prose-quotes: #fff !important;
               --tw-prose-captions: #fff !important;
               --tw-prose-code: #fff !important;
               --tw-prose-pre-code: #fff !important;
               --tw-prose-pre-bg: #fff !important;
               --tw-prose-th-borders: #fff !important;
               --tw-prose-td-borders: #fff !important;`
            : `color: #1f2937 !important; /* text-gray-800 */
               --tw-prose-body: #1f2937 !important;
               --tw-prose-headings: #1f2937 !important;
               --tw-prose-links: #1f2937 !important;
               --tw-prose-bold: #1f2937 !important;
               --tw-prose-counters: #1f2937 !important;
               --tw-prose-bullets: #1f2937 !important;
               --tw-prose-quotes: #1f2937 !important;
               --tw-prose-captions: #1f2937 !important;
               --tw-prose-code: #1f2937 !important;
               --tw-prose-pre-code: #1f2937 !important;
               --tw-prose-pre-bg: #1f2937 !important;
               --tw-prose-th-borders: #1f2937 !important;
               --tw-prose-td-borders: #1f2937 !important;`
          }
        }
      `}</style>

      {/* Animated Background Gradient */}
      {theme === "dark" && (
        <div className="inset-0 bg-gradient-to-br from-[#121212] via-[#1a1a1a] to-[#121212] opacity-80" />
      )}

      {/* Subtle Grid Pattern */}
      <div
        className={`w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMxLjIgMCAyLjMuNSAzLjIgMS4zLjguOCAxLjMgMiAxLjMgMy4ydjE1YzAgMS4yLS41IDIuMy0xLjMgMy4yLS44LjgtMiAxLjMtMy4yIDEuM0gyNGMtMS4yIDAtMi4zLS41LTMuMi0xLjMtLjgtLjgtMS4zLTItMS4zLTMuMlYyMi41YzAtMS4yLjUtMi4zIDEuMy0zLjIuOC0uOCAyLTEuMyAzLjItMS4zaDEyeiIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utb3BhY2l0eT0iLjEiLz48cGF0aCBkPSJNMzAgMGMxNi41NjkgMCAzMCAxMy40MzEgMzAgMzAgMCAxNi41NjktMTMuNDMxIDMwLTMwIDMwQzEzLjQzMSA2MCAwIDQ2LjU2OSAwIDMwIDAgMTMuNDMxIDEzLjQzMSAwIDMwIDB6bTAgMThjLTYuNjI3IDAtMTIgNS4zNzMtMTIgMTIgMCA2LjYyNyA1LjM3MyAxMiAxMiAxMiA2LjYyNyAwIDEyLTUuMzczIDEyLTEyIDAtNi42MjctNS4zNzMtMTItMTItMTJ6IiBzdHJva2U9IiMyMjIiIHN0cm9rZS1vcGFjaXR5PSIuMDUiLz48L2c+PC9zdmc+')] ${theme === "dark" ? "opacity-5" : "opacity-2"} -z-10`}
      />

      {/* Navbar */}
      <nav
        className={`sticky top-0 z-50 border-b ${theme === "dark" ? "border-[#333] bg-[#121212]/95" : "border-gray-200 bg-white/95"} backdrop-blur-xl`}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>WeaveHelp</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className={theme === "dark" ? "text-white" : "text-gray-700"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={theme === "dark" ? "text-white" : "text-gray-700"}
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center pt-16">
        <div className="w-full max-w-4xl flex flex-col flex-1">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 mt-0">
            {!chatStarted ? (
              <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] relative animate-in fade-in duration-700">
                <div className="relative w-full flex flex-col items-center">
                  {/* Animated blue-pink bouncing background behind heading */}
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
                    style={{
                      width: '340px',
                      height: '110px',
                      filter: 'blur(32px)',
                      background: 'linear-gradient(90deg, #3b82f6 0%, #ec4899 100%)',
                      opacity: 0.55,
                      animation: 'bounceBg 5s ease-in-out infinite',
                    }}
                  />
                  <style>{`
                    @keyframes bounceBg {
                      0%, 100% { transform: translate(-50%, -60px) scale(1); }
                      50% { transform: translate(-50%, 0px) scale(1.05); }
                    }
                  `}</style>
                  <h2
                    className={`relative z-10 text-3xl font-bold mb-8 text-center w-full ${
                      theme === "dark" ? "text-white" : "text-gray-800"
                    } animate-[float_3s_ease-in-out_infinite] hover:animate-[glow_2s_ease-in-out_infinite]`}
                  >
                    What can I help with?
                  </h2>
                </div>

                <p 
                  className={`text-center mb-8 px-4 text-sm w-full ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  } max-w-md mx-auto animate-[slideIn_0.5s_ease-out] wavy-text`}
                >
                  {Array.from("Your AI assistant for company policies, benefits, and documentation. Ask me anything or use the quick access buttons below.").map((char, i) => (
                    <span key={i} style={{ animationDelay: `${i * 0.05}s` }}>
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  ))}
                </p>

                <Card
                  className={`w-full ${
                    theme === "dark" ? "bg-[#1e1e1e] border-[#333]" : "bg-white border-gray-200"
                  } shadow-xl mb-6 transition-all duration-300 hover:shadow-2xl animate-[fadeInScale_0.5s_ease-out]`}
                >
                  <form onSubmit={handleSubmit} className="flex items-center p-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={
                        theme === "dark" ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-600"
                      }
                      onClick={handleFileUpload}
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Message WeaveHelp"
                      className={`flex-1 ${
                        theme === "dark"
                          ? "bg-transparent border-none text-white placeholder:text-gray-500"
                          : "bg-transparent border-none text-gray-800 placeholder:text-gray-400"
                      } focus-visible:ring-0 focus-visible:ring-offset-0`}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      onChange={() =>
                        fileInputRef.current?.files?.length &&
                        handleSubmit({ preventDefault: () => {} } as React.FormEvent)
                      }
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={
                          theme === "dark" ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-600"
                        }
                      >
                        <Search className="h-5 w-5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={
                          isRecording
                            ? "text-red-500 hover:text-red-600 animate-pulse"
                            : theme === "dark"
                              ? "text-gray-400 hover:text-gray-300"
                              : "text-gray-500 hover:text-gray-600"
                        }
                        onClick={handleVoiceInput}
                      >
                        <Mic className="h-5 w-5" />
                      </Button>
                      <Button
                        type="submit"
                        size="icon"
                        className={`${
                          theme === "dark"
                            ? "bg-white hover:bg-gray-200 text-black"
                            : "bg-black hover:bg-gray-800 text-white"
                        } rounded-full h-8 w-8 flex items-center justify-center`}
                        disabled={!input.trim() && !fileInputRef.current?.files?.length}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Card>

                {/* Quick Access Buttons with staggered animation */}
                <div className="flex flex-wrap gap-2 justify-center w-full">
                  {quickAccessQuestions.map((quickAccess, index) => (
                    <Button
                      key={quickAccess.id}
                      variant="outline"
                      size="sm"
                      className={`${
                        theme === "dark"
                          ? "bg-[#1e1e1e] border-[#333] text-white hover:bg-[#2a2a2a]"
                          : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50"
                      } transition-all duration-300 h-8 hover:scale-105 hover:shadow-lg animate-[slideIn_0.5s_ease-out]`}
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => handleQuickAccessClick(quickAccess)}
                    >
                      <div 
                        className={`${quickAccess.color} w-4 h-4 rounded-sm flex items-center justify-center mr-2 transition-transform duration-300 hover:rotate-12`}
                      >
                        {React.createElement(quickAccess.icon, { className: "h-2.5 w-2.5 text-white" })}
                      </div>
                      <span className="text-xs">{quickAccess.name}</span>
                    </Button>
                  ))}
                </div>

                {/* Add floating particles in the background */}
                {/* <div className="inset-0 overflow-hidden pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        theme === "dark" ? "bg-blue-500/20" : "bg-blue-500/10"
                      } animate-[float_${3 + i % 3}s_ease-in-out_infinite]`}
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                      }}
                    />
                  ))}
                </div> */}
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div className={`max-w-[90%] ${message.role === "user" ? "order-2" : "order-1"}`}>
                      <div className="flex items-start space-x-3">
                        {message.role === "assistant" && (
                          <Avatar
                            className={`w-8 h-8 border ${theme === "dark" ? "border-[#333]" : "border-gray-200"}`}
                          >
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                              WH
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`rounded-2xl p-4 ${
                            message.role === "user"
                              ? theme === "dark"
                                ? "bg-[#1e1e1e] text-white shadow-sm"
                                : "bg-blue-100 text-gray-800 shadow-sm"
                              : theme === "dark"
                                ? "bg-[#18181b] border border-[#333] shadow-2xl text-white font-semibold"
                                : "bg-white border border-gray-200 text-gray-800 shadow-sm"
                          }`}
                        >
                          {message.role === "assistant" && message.isStreaming ? (
                            <div className={`assistant-markdown ${theme === "dark" ? "text-white" : "text-gray-800"} text-sm leading-relaxed whitespace-pre-line`}>
                              <ReactMarkdown>{message.streamedContent}</ReactMarkdown>
                            </div>
                          ) : (
                            <div className={`assistant-markdown ${theme === "dark" ? "text-white" : "text-gray-800"} text-sm leading-relaxed whitespace-pre-line`}>
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          )}

                          {/* File attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.attachments.map((file, index) => (
                                <div
                                  key={index}
                                  className={`flex items-center p-2 rounded-lg ${theme === "dark" ? "bg-[#2a2a2a]" : "bg-gray-100"}`}
                                >
                                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`text-xs font-medium truncate ${theme === "dark" ? "text-white" : "text-gray-700"}`}
                                    >
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{file.size}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {message.role === "assistant" && !message.isStreaming && message.relatedTopics && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {message.relatedTopics.map((topic, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className={`text-xs ${
                                    theme === "dark"
                                      ? "bg-[#2a2a2a] border-[#333] text-gray-300 hover:bg-[#333]"
                                      : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
                                  } cursor-pointer transition-colors`}
                                  onClick={() => handleSuggestionClick({ id: "topic", text: topic, category: "Topic" })}
                                >
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {message.role === "user" && (
                          <Avatar
                            className={`w-8 h-8 border ${theme === "dark" ? "border-[#333]" : "border-gray-200"}`}
                          >
                            <AvatarFallback className={
                              message.role === "user"
                                ? theme === "dark"
                                  ? "bg-gradient-to-r from-gray-700 to-gray-900 text-white text-xs"
                                  : "bg-gray-700 text-white text-xs px-2 py-1 rounded-full"
                                : theme === "dark"
                                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs"
                                  : "bg-blue-400 text-white text-xs"
                            }>
                              {message.role === "user" ? "You" : "WH"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Thinking Animation */}
                {isThinking && (
                  <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-start space-x-3">
                      <Avatar className={`w-8 h-8 border ${theme === "dark" ? "border-[#333]" : "border-gray-200"}`}>
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                          WH
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-2xl p-4 ${theme === "dark" ? "bg-[#1e1e1e]" : "bg-white border border-gray-200"}`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={theme === "dark" ? "text-gray-300 text-sm" : "text-gray-600 text-sm"}>
                            Thinking
                          </span>
                          <div className="flex space-x-1">
                            <div
                              className={`w-2 h-2 ${theme === "dark" ? "bg-gray-400" : "bg-gray-500"} rounded-full animate-bounce`}
                              style={{ animationDelay: "0ms" }}
                            />
                            <div
                              className={`w-2 h-2 ${theme === "dark" ? "bg-gray-400" : "bg-gray-500"} rounded-full animate-bounce`}
                              style={{ animationDelay: "150ms" }}
                            />
                            <div
                              className={`w-2 h-2 ${theme === "dark" ? "bg-gray-400" : "bg-gray-500"} rounded-full animate-bounce`}
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area with Suggestions (when chat has started) */}
          {chatStarted && (
            <>
              {/* Suggestion Buttons - Similar to v0.dev */}
              <div className="relative px-4 py-3 animate-in slide-in-from-bottom duration-300 flex items-center bg-gradient-to-t from-background to-transparent">
                {/* Left Arrow */}
                {showLeftArrow && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute left-2 z-10 bg-background/80 hover:bg-background ${theme === "dark" ? "text-gray-400" : "text-gray-700"} w-6 h-6`}
                    onClick={() => suggestionsRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
                  >
                    &lt;
                  </Button>
                )}

                {/* Suggestions Container */}
                <div
                  ref={suggestionsRef}
                  className="flex gap-2 overflow-x-auto flex-nowrap scrollbar-hide w-full px-8"
                >
                  {(suggestions.length > 0 ? suggestions : [
                    // Default suggestions for when suggestions are empty initially or API fails
                    { id: "default-1", text: "How do I access the employee handbook?", category: "General" },
                    { id: "default-2", text: "What training programs are available?", category: "General" },
                    { id: "default-3", text: "Who do I contact for IT support?", category: "General" },
                  ]).map((suggestion) => (
                    <Button
                      key={suggestion.id}
                      variant="outline"
                      size="sm"
                      className={`${
                        theme === "dark"
                          ? "bg-[#1e1e1e] border-[#333] text-white hover:bg-[#2a2a2a]"
                          : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50"
                      } text-xs h-8 px-3 transition-all duration-200 hover:scale-105 flex-shrink-0`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion.text}
                    </Button>
                  ))}
                </div>

                {/* Right Arrow */}
                {showRightArrow && (
                   <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute right-2 z-10 bg-background/80 hover:bg-background ${theme === "dark" ? "text-gray-400" : "text-gray-700"} w-6 h-6`}
                    onClick={() => suggestionsRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                  >
                    &gt;
                  </Button>
                )}
              </div>

              {/* Input Area - Fixed at Bottom */}
              <div
                className={`sticky bottom-0 w-full p-4 ${
                  theme === "dark" ? "bg-[#121212]/95 border-t border-[#333]" : "bg-gray-50/95 border-t border-gray-200"
                } animate-in slide-in-from-bottom duration-300 backdrop-blur-xl`}
              >
                <Card
                  className={`w-full max-w-4xl mx-auto ${
                    theme === "dark"
                      ? "bg-[#1e1e1e] border-[#333] shadow-lg"
                      : "bg-white border border-gray-200 shadow-md"
                  }`}
                >
                  <form onSubmit={handleSubmit} className="flex items-center p-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={
                        theme === "dark" ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-600"
                      }
                      onClick={handleFileUpload}
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Message WeaveHelp..."
                      className={`flex-1 ${
                        theme === "dark"
                          ? "bg-transparent border-none text-white placeholder:text-gray-500"
                          : "bg-white border-none text-gray-800 placeholder:text-gray-400"
                      } focus-visible:ring-0 focus-visible:ring-offset-0`}
                      disabled={isThinking}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      onChange={() =>
                        fileInputRef.current?.files?.length &&
                        handleSubmit({ preventDefault: () => {} } as React.FormEvent)
                      }
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={
                          theme === "dark" ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-600"
                        }
                      >
                        <Search className="h-5 w-5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={
                          isRecording
                            ? "text-red-500 hover:text-red-600 animate-pulse"
                            : theme === "dark"
                              ? "text-gray-400 hover:text-gray-300"
                              : "text-gray-500 hover:text-gray-600"
                        }
                        onClick={handleVoiceInput}
                      >
                        <Mic className="h-5 w-5" />
                      </Button>
                      <Button
                        type="submit"
                        size="icon"
                        className={`${
                          theme === "dark"
                            ? "bg-white hover:bg-gray-200 text-black"
                            : "bg-black hover:bg-gray-800 text-white"
                        } rounded-full h-8 w-8 flex items-center justify-center`}
                        disabled={isThinking || (!input.trim() && !fileInputRef.current?.files?.length)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card
            className={`w-full max-w-md mx-4 ${theme === "dark" ? "bg-[#1a1a1a] text-white" : "bg-white text-gray-800"}`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Settings</h2>
                <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Tabs defaultValue="appearance" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="appearance">Appearance</TabsTrigger>
                  <TabsTrigger value="account">Account</TabsTrigger>
                </TabsList>
                <TabsContent value="appearance" className="mt-4 space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Dark Mode</Label>
                        <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          Switch between light and dark themes
                        </p>
                      </div>
                      <Switch
                        checked={theme === "dark"}
                        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Animations</Label>
                        <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          Enable or disable UI animations
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="account" className="mt-4 space-y-4">
                  <div className="flex items-center space-x-4 p-4 rounded-lg border">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-r from-gray-700 to-gray-900 text-white">
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h4 className="font-medium">Demo User</h4>
                      <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        demo@example.com
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
