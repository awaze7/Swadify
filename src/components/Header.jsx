import Logo from "url:../utils/Logo.png";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiShoppingCart, FiMenu, FiX, FiLogOut, FiUser } from "react-icons/fi";
import { useState, useEffect, useMemo } from "react";
import UserDropdown from "./UserDropdown";
import Avatar from "./Avatar";
import useLogout from "../utils/useLogout";

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
        `rounded-lg px-3 py-2 text-base font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 focus-visible:ring-offset-yellow-300 ${
            isActive ? "bg-yellow-400 text-gray-900" : "text-gray-800 hover:bg-yellow-400/70"
        }`;

    const mobileLinkClasses = ({ isActive }) =>
        `block rounded-lg px-4 py-3 text-base font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 ${
            isActive ? "bg-yellow-400 text-gray-900" : "text-gray-800 hover:bg-yellow-400/70"
        }`;

    const cartBadge = cartCount > 0 && (
        <span
            className="absolute -right-2 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold leading-none text-white ring-2 ring-yellow-300"
            aria-hidden="true"
        >
            {cartCount > 99 ? "99+" : cartCount}
        </span>
    );

    return (
        <header className="sticky top-0 z-40 border-b-2 border-yellow-400 bg-gradient-to-r from-yellow-300 via-yellow-300 to-yellow-200 font-sans shadow-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
                <Link
                    to="/"
                    aria-label="Swadify home"
                    className="rounded-lg transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                >
                    <img className="w-16 md:w-20" src={Logo} alt="Swadify" />
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
                            `relative ml-1 rounded-lg p-2.5 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 focus-visible:ring-offset-yellow-300 ${
                                isActive ? "bg-yellow-400" : "hover:bg-yellow-400/70"
                            }`
                        }
                        aria-label={
                            cartCount > 0
                                ? `Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`
                                : "Cart, empty"
                        }
                    >
                        <span className="relative block">
                            <FiShoppingCart size={22} className="text-gray-900" aria-hidden="true" />
                            {cartBadge}
                        </span>
                    </NavLink>

                    <div className="ml-2">
                        {user ? (
                            <UserDropdown />
                        ) : (
                            <Link
                                to="/login"
                                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-black active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 focus-visible:ring-offset-yellow-300"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </nav>

                {/* Mobile controls */}
                <div className="flex items-center gap-1 md:hidden">
                    <Link
                        to="/cart"
                        className="relative rounded-lg p-2.5 transition-colors hover:bg-yellow-400/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                        aria-label={
                            cartCount > 0
                                ? `Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`
                                : "Cart, empty"
                        }
                    >
                        <span className="relative block">
                            <FiShoppingCart size={22} className="text-gray-900" aria-hidden="true" />
                            {cartBadge}
                        </span>
                    </Link>

                    <button
                        type="button"
                        id="menu-button"
                        onClick={() => setMenuOpen((open) => !open)}
                        className="rounded-lg p-2.5 text-gray-900 transition-colors hover:bg-yellow-400/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
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
                    className="border-t-2 border-yellow-400 bg-yellow-100 md:hidden"
                >
                    {user && (
                        <div className="flex items-center gap-3 border-b border-yellow-300 px-4 py-3.5">
                            <Avatar user={user} size="md" />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                    {user.displayName || "Your account"}
                                </p>
                                <p className="truncate text-xs text-gray-600">{user.email}</p>
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
                                <NavLink to="/profile" className={mobileLinkClasses}>
                                    <span className="flex items-center gap-2.5">
                                        <FiUser size={17} aria-hidden="true" />
                                        My Profile
                                    </span>
                                </NavLink>
                                {/*
                                  This button previously only called
                                  setMenuOpen(false) — it looked like a logout
                                  control but did nothing at all. It now runs the
                                  same shared logout as the desktop dropdown.
                                */}
                                <button
                                    type="button"
                                    onClick={logout}
                                    disabled={isLoggingOut}
                                    className="block w-full rounded-lg px-4 py-3 text-left text-base font-semibold text-red-700 transition-colors duration-150 hover:bg-red-100 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
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
