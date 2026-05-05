import { ReactNode } from "react";

type ChildrenNodes = {
    children : ReactNode
}

export default function MainSection({children} : ChildrenNodes){
    return (
        <main className = "flex grow justify-center items-center">
            <div className="flex flex-col bg-white w-5/6 h-full px-2 py-1 border-x-2 max-w-7xl min-w-sm">
                {children}
            </div>
        </main>
    )
}