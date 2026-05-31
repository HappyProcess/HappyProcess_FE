import { ReactNode } from "react";

type ChildrenNodes = {
    children: ReactNode
}

export default function MainSection({ children }: ChildrenNodes) {
    return (
        <main className="flex flex-1 justify-center bg-[#f5f5f7] w-full overflow-hidden">
          <div className="flex flex-col w-full max-w-md bg-white overflow-y-auto">
            {children}
          </div>
        </main>
    )
}
