"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const COUNTER_ID = process.env.NEXT_PUBLIC_YM_ID;

declare global {
  interface Window {
    ym?: (id: number, method: string, ...args: unknown[]) => void;
  }
}

export default function YandexMetrika() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!COUNTER_ID) return;
    const url = `${pathname}${searchParams.toString() ? `?${searchParams}` : ""}`;
    window.ym?.(Number(COUNTER_ID), "hit", url);
  }, [pathname, searchParams]);

  if (!COUNTER_ID) return null;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r)return;}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
ym(${COUNTER_ID},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});
`,
      }}
    />
  );
}
