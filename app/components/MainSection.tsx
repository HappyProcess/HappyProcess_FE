import { ReactNode } from "react";

type ChildrenNodes = {
    children: ReactNode
}

export default function MainSection({ children }: ChildrenNodes) {
    return (
        <main className="flex grow justify-center items-center py-20">
            {children}
        </main>
    )
}
