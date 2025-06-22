"use client";

import React, { useEffect, useRef } from 'react'
import { Button } from './ui/button'
import Link from 'next/link'
import Image from 'next/image'

const HeroSection = () => {
    const imageRef = useRef(null);
    useEffect(() => {
        const imageElement = imageRef.current;

        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            const scrollThreshold = 100;

            if (scrollPosition > scrollThreshold) {
                imageElement.classList.add("scrolled");
            } else {
                imageElement.classList.remove("scrolled");
            };
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);
    
    return (
        <section className="w-full pt-36 md:pt-48 pb-10">
            {/* Below  the short intro of the website */}
            <div className="space-y-6 text-center">
                <div className="space-y-6 mx-auto ">
                    <h1 className="text-5xl font-bold md:text-6xl lg:text-7xl xl:text-8xl gradient-title animate-gradient"> 
                        Your AI Career Coach for
                        <br />
                        Professional Success
                    </h1>
                    <p className="mx-auto max-w-[600px] text-muted-foreground md:text-x1">
                        Advance Your Career with personalized guidance, interview prep, and 
                        AI-powered tools for job success.
                    </p>
                </div>

                {/* Buttons and the links  */}
                <div className="flex justify-center space-x-4">
                    <Link href="/dashboard">
                        <Button size="lg" className="px-8">
                            Get Stated 
                        </Button>
                    </Link>
                </div>

                {/* first banner (hero image) */}
                <div className="hero-image-wrapper md: mt-0">
                    <div ref={imageRef} className="hero-image"> 
                        <Image
                        src={"/banner.jpeg"}
                        width={1280}
                        height={720}
                        alt="Banner CareerGeniie"
                        className="rounded-1g shadow-2x1 border mx-auto"
                        priority
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection
