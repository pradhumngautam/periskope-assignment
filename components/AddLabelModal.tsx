"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Label, Chat } from "@/types"
import { X } from "lucide-react"

interface AddLabelModalProps {
  chat: Chat
  onClose: () => void
  onLabelsUpdated: () => void
}

export default function AddLabelModal({ chat, onClose, onLabelsUpdated }: AddLabelModalProps) {
  const [labels, setLabels] = useState<Label[]>([])
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLabels = async () => {
      setLoading(true)

      // Fetch all available labels
      const { data: allLabels, error: labelsError } = await supabase.from("labels").select("*")

      if (labelsError) {
        console.error("Error fetching labels:", labelsError)
        setLoading(false)
        return
      }

      setLabels(allLabels || [])

      // Fetch labels already assigned to this chat
      const { data: chatLabels, error: chatLabelsError } = await supabase
        .from("chat_labels")
        .select("label_id")
        .eq("chat_id", chat.id)

      if (chatLabelsError) {
        console.error("Error fetching chat labels:", chatLabelsError)
        setLoading(false)
        return
      }

      setSelectedLabels(chatLabels?.map((cl) => cl.label_id) || [])
      setLoading(false)
    }

    fetchLabels()
  }, [chat.id])

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) => (prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]))
  }

  const handleSave = async () => {
    try {
      // First, delete all existing labels for this chat
      await supabase.from("chat_labels").delete().eq("chat_id", chat.id)

      // Then, insert the selected labels
      if (selectedLabels.length > 0) {
        const chatLabels = selectedLabels.map((labelId) => ({
          chat_id: chat.id,
          label_id: labelId,
        }))

        await supabase.from("chat_labels").insert(chatLabels)
      }

      onLabelsUpdated()
      onClose()
    } catch (error) {
      console.error("Error updating labels:", error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Manage Labels</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="py-4 text-center">Loading labels...</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {labels.map((label) => (
                <div
                  key={label.id}
                  className={`p-2 rounded-md cursor-pointer border ${
                    selectedLabels.includes(label.id) ? "border-green-500 bg-green-50" : "border-gray-200"
                  }`}
                  onClick={() => toggleLabel(label.id)}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: label.color }} />
                    <span>{label.name}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-green-500 text-white rounded-md">
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

