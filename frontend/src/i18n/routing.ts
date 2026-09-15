import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
    // A list of all locales that are supported
    // Note: Georgian uses the correct ISO 639-1 tag 'ka' (not 'ge', which is
    // the country code for Georgia, not the language code).
    locales: ['en', 'de', 'ka', 'ru'],

    // Used when no locale matches
    defaultLocale: 'en'
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);
