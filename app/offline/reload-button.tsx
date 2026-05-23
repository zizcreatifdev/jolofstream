"use client"

export function ReloadButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") window.location.reload()
      }}
      className="rounded-[10px] bg-[#C8151B] px-6 py-3 font-semibold text-white transition-all duration-150 hover:bg-[#8F0E12]"
    >
      Reessayer
    </button>
  )
}
