import { useClock, useTimer } from './hooks'
import './App.css'

export const App = () => {
  const {
    hours: clockHours,
    minutes: clockMinutes,
    seconds: clockSeconds,
  } = useClock()
  const {
    hours: timerHours,
    minutes: timerMinutes,
    seconds: timerSeconds,
    onStart,
    onReset,
    onStop,
    isNegative,
    onChangeHour,
    onChangeMinute,
    onChangeSecond,
  } = useTimer()

  return (
    <main className="wrapper">
      <div className="container">
        <section>
          <h1 className="title">Clock</h1>
          <p className="timer">
            {String(clockHours).padStart(2,'0')}:
            {String(clockMinutes).padStart(2, '0')}:
            {String(clockSeconds).padStart(2, '0')}
          </p>
        </section>
        <section>
          <h1 className="title">Timer</h1>
          <p className={`timer ${isNegative ? 'negative': ''}`}>
            {isNegative && '-'}
            {String(timerHours).padStart(2,'0')}:
            {String(timerMinutes).padStart(2, '0')}:
            {String(timerSeconds).padStart(2, '0')}
          </p>
          <div className="columns-3">
            <input
              className="input"
              type="number"
              placeholder="Horas"
              onChange={(e) => onChangeHour(parseInt(e.target.value || "0", 10))}
            />
            <input
              className="input"
              type="number"
              placeholder="Minutos"
              onChange={(e) => onChangeMinute(parseInt(e.target.value || "0", 10))}
            />
            <input
              className="input"
              type="number"
              placeholder="Segundos"
              onChange={(e) => onChangeSecond(parseInt(e.target.value || "0", 10))}
            />
          </div>
          <div className="columns-3">
            <button onClick={onStart} className="button">Iniciar</button>
            <button onClick={onStop} className="button">Pausar</button>
            <button onClick={onReset} className="button">Resetar</button>
          </div>
        </section>
      </div>
    </main>
  )
}
