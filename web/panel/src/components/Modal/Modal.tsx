import { XIcon } from "lucide-react";
import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  data: {
    title: string;
    content: React.ReactNode;
  };
}

export default function Modal({ isOpen, onClose, data }: ModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-100 bg-(--color-background-primary) opacity-85"
        onClick={onClose}
      />

      {/* Centering wrapper */}
      <div
        className="fixed inset-0 z-101 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal panel */}
        <div
          className="fixed z-101 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
             w-full min-w-lg max-w-fit p-6
             bg-(--color-background-secondary) color-(--color-foreground-primary)
             rounded-md shadow-lg"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
        >
          <div className="flex items-center gap-4 mb-4">
            <span className="text-2xl">{data.title}</span>
            <button
              className="ml-auto"
              onClick={onClose}
              aria-label="Close modal"
            >
              <XIcon className="cursor-pointer" />
            </button>
          </div>

          {/* Make sure body can stretch full width */}
          <div className="mb-4">
            <div className="w-full text-left">{data.content}</div>
          </div>
        </div>
      </div>
    </>
  );
}
