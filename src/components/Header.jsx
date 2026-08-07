import Logo from "url:../utils/Logo.png";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiShoppingCart, FiMenu, FiX, FiLogOut, FiUser, FiShoppingBag } from "react-icons/fi";
import { useState, useEffect, useMemo } from "react";
import UserDropdown from "./UserDropdown";
import Avatar from "./Avatar";
import useLogout from "../utils/useLogout";
import { buttonClasses } from "./Button";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
];

const Header = () => {
    const user = useSelector((store) => store.user.user);
    const cartItems = useSelector((store) => store.cart.items);
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();
    const { logout, isLoggingOut } = useLogout();

    /*
     * Total units, not distinct lines. The badge previously showed
     * `cartItems.length`, so adding a 3rd portion of the same dish left the badge
     * reading "1" while the cart page reported 3 items.
     */
    const cartCount = useMemo(
        () => cartItems.reduce((sum, item) => sum + (item.count || 0), 0),
        [cartItems]
    );

    // Dismiss the mobile sheet on navigation.
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    // Escape closes the mobile sheet.
    useEffect(() => {
        if (!menuOpen) return;
        const onKeyDown = (event) => {
            if (event.key === "Escape") setMenuOpen(false);
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [menuOpen]);

    const navLinkClasses = ({ isActive }) =>
        `rounded-lg px-3 py-2 text-base font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-yellow-300 dark:focus-visible:ring-offset-gray-900 ${
            isActive
              ? "bg-yellow-400 text-gray-900 dark:bg-yellow-500 dark:text-gray-900"
              : "text-gray-800 dark:text-gray-200 hover:bg-yellow-400/70 dark:hover:bg-yellow-500/20"
        }`;

    const mobileLinkClasses = ({ isActive }) =>
        `block rounded-lg px-4 py-3 text-base font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-yellow-400 ${
            isActive
              ? "bg-yellow-400 text-gray-900 dark:bg-yellow-500 dark:text-gray-900"
              : "text-gray-800 dark:text-gray-200 hover:bg-yellow-400/70 dark:hover:bg-yellow-500/20"
        }`;

    const cartBadge = cartCount > 0 && (
        <span
            className="absolute -right-2 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold leading-none text-white ring-2 ring-yellow-300 dark:ring-gray-900"
            aria-hidden="true"
        >
            {cartCount > 99 ? "99+" : cartCount}
        </span>
    );

    return (
        <header className="sticky top-0 z-40 border-b-2 border-yellow-400 dark:border-yellow-500/60 bg-gradient-to-r from-yellow-300 via-yellow-300 to-yellow-200 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 font-sans shadow-md dark:shadow-gray-950/50">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
                <Link
                    to="/"
                    aria-label="Swadify home"
                    className="rounded-lg transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                >
                    {/*
                      Intrinsic dimensions let the browser reserve the box before
                      the image decodes. Without them this had width but no
                      height, so the sticky header collapsed to the nav's height
                      on first paint and everything below it jumped once the logo
                      arrived. The source is square (1600x1600), so the ratio here
                      matches the `w-16`/`w-20` + `h-16`/`h-20` sizing.
                    */}
                    <img
                        className="h-16 w-16 md:h-20 md:w-20"
                        src={Logo}
                        alt="Swadify"
                        width={1600}
                        height={1600}
                    />
                </Link>

                {/* Desktop navigation */}
                <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
                    {NAV_LINKS.map(({ to, label }) => (
                        <NavLink key={to} to={to} className={navLinkClasses}>
                            {label}
                        </NavLink>
                    ))}

                    <NavLink
                        to="/cart"
                        className={({ isActive }) =>
                            `relative ml-1 rounded-lg p-2.5 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-yellow-300 dark:focus-visible:ring-offset-gray-900 ${
                                isActive ? "bg-yellow-400 dark:bg-yellow-500/20" : "hover:bg-yellow-400/70 dark:hover:bg-yellow-500/20"
                            }`
                        }
                        aria-label={
                            cartCount > 0
                                ? `Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`
                                : "Cart, empty"
                        }
                    >
                        <span className="relative block">
                            <FiShoppingCart size={22} className="text-gray-900 dark:text-gray-200" aria-hidden="true" />
                            {cartBadge}
                        </span>
                    </NavLink>

                    <div className="ml-1">
                        <ThemeToggle />
                    </div>

                    <div className="ml-1">
                        {user ? (
                            <UserDropdown />
                        ) : (
                            <Link
                                to="/login"
                                className={buttonClasses({ variant: "onYellow", size: "sm" })}
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </nav>

                {/* Mobile controls */}
                <div className="flex items-center gap-1 md:hidden">
                    <ThemeToggle />
                    <Link
                        to="/cart"
                        className="relative rounded-lg p-2.5 transition-colors hover:bg-yellow-400/70 dark:hover:bg-yellow-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-yellow-400"
                        aria-label={
                            cartCount > 0
                                ? `Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`
                                : "Cart, empty"
                        }
                    >
                        <span className="relative block">
                            <FiShoppingCart size={22} className="text-gray-900 dark:text-gray-200" aria-hidden="true" />
                            {cartBadge}
                        </span>
                    </Link>

                    <button
                        type="button"
                        id="menu-button"
                        onClick={() => setMenuOpen((open) => !open)}
                        className="rounded-lg p-2.5 text-gray-900 dark:text-gray-200 transition-colors hover:bg-yellow-400/70 dark:hover:bg-yellow-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-yellow-400"
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={menuOpen}
                        aria-controls="mobile-menu"
                    >
                        {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile sheet */}
            {menuOpen && (
                <nav
                    id="mobile-menu"
                    aria-label="Mobile"
                    className="border-t-2 border-yellow-400 dark:border-yellow-500/40 bg-yellow-100 dark:bg-gray-800 md:hidden"
                >
                    {user && (
                        <div className="flex items-center gap-3 border-b border-yellow-300 dark:border-gray-700 px-4 py-3.5">
                            <Avatar user={user} size="md" />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {user.displayName || "Your account"}
                                </p>
                                <p className="truncate text-xs text-gray-600 dark:text-gray-400">{user.email}</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1 px-2 py-3">
                        {NAV_LINKS.map(({ to, label }) => (
                            <NavLink key={to} to={to} className={mobileLinkClasses}>
                                {label}
                            </NavLink>
                        ))}
                        <NavLink to="/cart" className={mobileLinkClasses}>
                            Cart{cartCount > 0 ? ` (${cartCount})` : ""}
                        </NavLink>

                        {user ? (
                            <>
                                <NavLink to="/profile" end className={mobileLinkClasses}>
                                    <span className="flex items-center gap-2.5">
                                        <FiUser size={17} aria-hidden="true" />
                                        My Profile
                                    </span>
                                </NavLink>
                                <NavLink to="/profile/orders" className={mobileLinkClasses}>
                                    <span className="flex items-center gap-2.5">
                                        <FiShoppingBag size={17} aria-hidden="true" />
                                        My Orders
                                    </span>
                                </NavLink>
                                <button
                                    type="button"
                                    onClick={logout}
                                    disabled={isLoggingOut}
                                    className="block w-full rounded-lg px-4 py-3 text-left text-base font-semibold text-red-700 dark:text-red-400 transition-colors duration-150 hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                                >
                                    <span className="flex items-center gap-2.5">
                                        <FiLogOut size={17} aria-hidden="true" />
                                        {isLoggingOut ? "Logging out…" : "Logout"}
                                    </span>
                                </button>
                            </>
                        ) : (
                            <NavLink to="/login" className={mobileLinkClasses}>
                                Login
                            </NavLink>
                        )}
                    </div>
                </nav>
            )}
        </header>
    );
};

export default Header;
