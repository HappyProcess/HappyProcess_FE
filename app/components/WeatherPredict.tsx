import { useEffect, useState } from "react";
import WeatherIcon from "./IconComponents/WeatherIcon";

export default function futureWeather() {
  const [weatherList, setWeatherList] = useState<number[]>([]);

  useEffect(() => {
    setWeatherList([0, 1, 2, 3, 4, 5, 6]);
  }, []);

  return (
    <>
      <div className="flex flex-row items-center justify-center">
        {weatherList.map((idx) => {
          return (
            <WeatherIcon index={idx} scale={0.5}/>
          )
        })}
      </div>
    </>
  )
}