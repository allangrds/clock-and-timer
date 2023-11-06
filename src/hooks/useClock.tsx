import * as React from 'react'

export const useClock = () => {
  const [time, setTime] = React.useState(new Date())

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  return {
    hours, minutes, seconds
  }
}
