'use client'

export function TaskTabs({
  active = 'all',
  onChange,
}) {
  const tabs = [
    {
      value: 'all',
      label: 'All Tasks',
    },
    {
      value: 'mine',
      label: 'My Tasks',
    },
  ]

  return (
    <div
      className="
        flex
        h-[40px]
        items-center
        gap-7
        border-0
        bg-transparent
        p-0
        shadow-none
      "
    >
      {tabs.map((tab) => {
        const selected = active === tab.value

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange?.(tab.value)}
            className={`
              relative
              flex
              h-full
              min-w-[72px]
              items-center
              justify-center
              whitespace-nowrap
              border-0
              bg-transparent
              px-3
              text-[14px]
              font-semibold
              shadow-none
              outline-none
              transition-all
              duration-200

              ${
                selected
                  ? 'text-violet-600'
                  : 'text-slate-600 hover:text-violet-600'
              }
            `}
          >
            {tab.label}

            {selected && (
              <span
                className="
                  absolute
                  bottom-0
                  left-2
                  right-2
                  h-[3px]
                  rounded-full
                  bg-violet-600
                "
              />
            )}
          </button>
        )
      })}
    </div>
  )
}