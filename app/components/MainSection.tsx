import { ReactNode } from "react";
import BottomNav from "./BottomNav";

type ChildrenNodes = {
    children: ReactNode
}

export default function MainSection({ children }: ChildrenNodes) {
    return (
        <main className="relative flex flex-1 justify-center bg-[#f2f4f6] w-full overflow-hidden">
          <div className="flex flex-col w-full max-w-md bg-[#f2f4f6] overflow-y-auto">
            {children}
            {/* 플로팅 하단 탭바 클리어런스. flex-column 스크롤 컨테이너의 padding-bottom은
                스크롤 끝에서 무시되므로, height를 가진 스페이서로 확실히 공간을 확보한다. */}
            <div aria-hidden className="h-32 shrink-0" />
          </div>
          <BottomNav />
        </main>
    )
}
