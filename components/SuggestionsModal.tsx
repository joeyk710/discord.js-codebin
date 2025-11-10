'use client'

import { useRef, useEffect } from 'react'
import SuggestionsPanel from './SuggestionsPanel'
import { Suggestion } from '@/lib/analyzer'

interface SuggestionsModalProps {
    isOpen: boolean
    onClose: () => void
    suggestions: Suggestion[]
}

export default function SuggestionsModal({ isOpen, onClose, suggestions }: SuggestionsModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal()
        } else {
            dialogRef.current?.close()
        }
    }, [isOpen])

    return (
        <dialog ref={dialogRef} className="modal" onClose={onClose}>
            <div className="modal-box w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] rounded-2xl">
                <h3 className="font-bold text-base sm:text-lg mb-4">💡 Tips & Suggestions</h3>

                <div className="overflow-y-auto max-h-[calc(90vh-150px)] sm:max-h-[calc(80vh-150px)]">
                    {suggestions.length === 0 ? (
                        <div className="text-center text-base-content/60 flex flex-col items-center justify-center gap-3 py-8">
                            <span className="text-4xl sm:text-5xl">✅</span>
                            <div>
                                <p className="font-semibold text-base sm:text-lg">No issues found!</p>
                                <p className="text-xs sm:text-sm mt-1">Your code looks great.</p>
                            </div>
                        </div>
                    ) : (
                        <SuggestionsPanel suggestions={suggestions} />
                    )}
                </div>

                <div className="modal-action">
                    <form method="dialog">
                        <button className="btn btn-sm sm:btn-md btn-primary rounded-xl">Close</button>
                    </form>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button>close</button>
            </form>
        </dialog>
    )
}
