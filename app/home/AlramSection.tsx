import { IllnessIcon, SwitchIcon } from "@/components";

export default function alram() {
  return (
    <>
      <section className="flex flex-col items-center w-full p-3 gap-5">
        <div className="w-full flex flex-row items-center justify-between">
          <h1 className="text-2xl font-bold">알림</h1>
          <p className="text-2xl cursor-pointer">⊕</p>
        </div>
        <div className="h-0 border-gray-300 w-full border-y" />
        {<>
          <div className="w-full grid grid-cols-2 gap-3">
            <h1 className="font-bold text-3xl">08:00</h1>
            <div className='flex flex-row items-center justify-between'>
              <SwitchIcon scale={5/32} className="cursor-pointer"/>
              <p className="cursor-pointer">편집</p>
            </div>
          </div>
          <div className="h-0 border-gray-300 w-full border-y" />
        </>}
        
      </section>
      <section className="flex flex-col items-center w-full p-3 gap-5">
        <h1 className="w-full font-bold text-2xl">알림 센터</h1>
        <div className="w-full max-h-72 overflow-y-auto flex flex-col items-center 
         scollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {
            <section className="flex flex-col w-full">
              <h1 className="w-full text-right font-bold text-sm">오늘의 날짜</h1>
              <div className="flex flex-row items-center border-2 border-red-100 rounded-2xl bg-red-50 w-full p-3 gap-5">
                <IllnessIcon index={1} scale={0.25}/>
                <div className="flex flex-col">
                  <p className="font-bold">{"천식"} 위험도</p>
                  <h1 className="text-red-500 font-bold text-2xl">{"높음"}</h1>
                  <p className="font-semibold text-sm">{"외출 시 주의가 필요해요!"}</p>
                </div>
              </div>
            </section>
          }
        </div>
      </section>
    </>
  )
}