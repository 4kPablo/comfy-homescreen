"use client"

export default function AnalogClock({ time, hideSeconds, className }) {
  const hours = time.getHours() % 12
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()

  const hourAngle = hours * 30 + minutes * 0.5
  const minuteAngle = minutes * 6 + seconds * 0.1
  const secondAngle = seconds * 6

  const size = 250
  const center = size / 2
  const outerRadius = size / 2 - 4

  return (
    <div className={`w-full aspect-square flex flex-col items-center justify-center p-2 relative ${className || ""}`}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full drop-shadow-sm mx-auto">
        {/* Circulo exterior */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="var(--card)"
          stroke="var(--border)"
          strokeWidth="2"
        />

        {/* Subdivisiones - 60 marcas en el borde */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i * 6 - 90) * (Math.PI / 180)
          const isHour = i % 5 === 0
          const outerR = outerRadius - 4
          const innerR = isHour ? outerRadius - 18 : outerRadius - 8

          const x1 = center + outerR * Math.cos(angle)
          const y1 = center + outerR * Math.sin(angle)
          const x2 = center + innerR * Math.cos(angle)
          const y2 = center + innerR * Math.sin(angle)

          return (
            <line
              key={`tick-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isHour ? "var(--primary)" : "var(--muted-foreground)"}
              strokeWidth={isHour ? 3 : 1.5}
              strokeLinecap="round"
              className="transition-colors duration-500"
            />
          )
        })}

        {/* Numeros de las horas */}
        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180)
          const r = outerRadius - 35
          const x = center + r * Math.cos(angle)
          const y = center + r * Math.sin(angle)

          return (
            <text
              key={num}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-foreground font-medium transition-colors duration-500"
              style={{ fontSize: "16px" }}
            >
              {num}
            </text>
          )
        })}

        {/* Manecilla de hora */}
        <line
          x1={center}
          y1={center}
          x2={center + 55 * Math.cos((hourAngle - 90) * (Math.PI / 180))}
          y2={center + 55 * Math.sin((hourAngle - 90) * (Math.PI / 180))}
          stroke="var(--primary)"
          strokeWidth="5"
          strokeLinecap="round"
          className="transition-colors duration-500"
        />

        {/* Manecilla de minutos */}
        <line
          x1={center}
          y1={center}
          x2={center + 80 * Math.cos((minuteAngle - 90) * (Math.PI / 180))}
          y2={center + 80 * Math.sin((minuteAngle - 90) * (Math.PI / 180))}
          stroke="var(--accent)"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="transition-colors duration-500"
        />

        {/* Manecilla de segundos */}
        {!hideSeconds && (
            <line
              x1={center}
              y1={center}
              x2={center + 88 * Math.cos((secondAngle - 90) * (Math.PI / 180))}
              y2={center + 88 * Math.sin((secondAngle - 90) * (Math.PI / 180))}
              stroke="var(--destructive)"
              strokeWidth="2"
              strokeLinecap="round"
              className="transition-colors duration-500"
            />
        )}

        {/* Centro */}
        <circle
          cx={center}
          cy={center}
          r="6"
          fill="var(--primary)"
          className="transition-colors duration-500"
        />
      </svg>
    </div>
  )
}
