"use client";
import { useState } from "react";

/** 출처가 제공한 대표 이미지를 원래 주소 그대로 보여 준다. 불러오지 못하면 사라져서 아래의 카테고리 그림이 보인다. */
export function Photo({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // 외부 주소를 그대로 가리키므로 next/image 최적화(재호스팅)를 쓰지 않는다
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full bg-white object-cover"
    />
  );
}
