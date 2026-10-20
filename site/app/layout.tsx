import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Продать технику Apple в Беларуси — loop.by',description:'Выкуп iPhone, Mac, iPad, Apple Watch и другой техники Apple у физических лиц и организаций. Расскажите об устройстве и получите индивидуальную оценку.',robots:{index:false,follow:false}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ru"><body>{children}</body></html>}
