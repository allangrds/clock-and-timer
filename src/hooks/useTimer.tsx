import * as React from 'react'

export const useTimer = () => {
  const [isRunning, setIsRunning] = React.useState(false)
  const [isNegative, setIsNegative] = React.useState(false)
  const [originalHours, setOriginalHours] = React.useState(0)
  const [originalMinutes, setOriginalMinutes] = React.useState(0)
  const [originalSeconds, setOriginalSeconds] = React.useState(0)
  const [hours, setHours] = React.useState(0)
  const [minutes, setMinutes] = React.useState(0)
  const [seconds, setSeconds] = React.useState(0)

  React.useEffect(() => {
    let intervalId: number | undefined

    if (isRunning) {
      intervalId = setInterval(() => {
        if (isNegative) {
          if (seconds === 59) {
            setSeconds(0)

            if (minutes === 59) {
              setMinutes(0)
              setHours(hours + 1)
            } else {
              setMinutes(minutes + 1)
            }
          } else {
            setSeconds(seconds + 1);
          }

          return
        }

        if (seconds === 0 && minutes === 0 && hours === 0) {
          setIsNegative(true)
          setSeconds(1)

          return
        }

        if (seconds === 0) {
          if (minutes === 0) {
            setHours(hours - 1);
            setMinutes(59);
          } else {
            setMinutes(minutes - 1);
          }
          setSeconds(59);
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning, hours, minutes, seconds, isNegative]);


  const onStart = () => setIsRunning(true)
  const onStop = () => setIsRunning(false)
  const onReset = () => {
    onStop()
    setIsNegative(false)
    setHours(originalHours)
    setMinutes(originalMinutes)
    setSeconds(originalSeconds)
  }
  const onChangeHour = (value: number) => {
    onReset()

    const maxHours = value > 99 ? 99 : value

    onStop()
    setOriginalHours(maxHours)
    setHours(maxHours)
  }
  const onChangeMinute = (value: number) => {
    onReset()

    const maxMinutes = value > 59 ? 59 : value

    onStop()
    setOriginalMinutes(maxMinutes)
    setMinutes(maxMinutes)
  }
  const onChangeSecond = (value: number) => {
    onReset()

    const maxSeconds = value > 59 ? 59 : value

    onStop()
    setOriginalSeconds(maxSeconds)
    setSeconds(maxSeconds)
  }

  return {
    onStart,
    onStop,
    onReset,
    hours,
    minutes,
    seconds,
    isNegative,
    onChangeHour,
    onChangeMinute,
    onChangeSecond,
  }
}
