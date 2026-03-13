"use client"

import Link from 'next/link'
import React from 'react'
import { usePathname } from 'next/navigation'

const Navbar = () => {
    const pathname = usePathname()

    return (
        <header className='border-b border-border pb-5'>
            <nav className='flex justify-between mt-5 ml-20 mr-20 items-center'>
                <p className='text-2xl font-bold'>Expence Tracker</p>
                <ul className='flex gap-4 justify-end'>
                    <Link href="/dashbord" className={`p-2 rounded-lg transition-colors ${pathname === '/dashbord' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}>Dashbord</Link>
                    <Link href="/expenses" className={`p-2 rounded-lg transition-colors ${pathname === '/expenses' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}>Expenses</Link>
                    <Link href="/analytics" className={`p-2 rounded-lg transition-colors ${pathname === '/analytics' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}>Analytics</Link>
                </ul>
            </nav>
        </header >
    )
}

export default Navbar