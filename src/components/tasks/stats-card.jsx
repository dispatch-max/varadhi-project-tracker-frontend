'use client'

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
}) {
  return (
    <div
      className="
        bg-card
        border border-border
        rounded-2xl
        px-5 py-4
        h-[115px]
        shadow-sm
        hover:shadow-md
        transition-all
        flex flex-col justify-between
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          {title}
        </h3>

        <Icon className="h-4 w-4 text-slate-400" />
      </div>

      {/* Content */}
      <div>
        <h2 className="text-4xl font-bold leading-none text-foreground">
          {value}
        </h2>

        <p className="mt-2 text-xs text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </div>
  )
}