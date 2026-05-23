"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useCan } from "../hooks/useAuth";
import {
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  UserCircleIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [{ icon: <GridIcon />, name: "Dashboard", path: "/" }],
  },
  {
    title: "Applications",
    items: [
      { icon: <ListIcon />, name: "All applications", path: "/admin/applications" },
    ],
  },
  {
    title: "Content",
    items: [
      {
        icon: <PageIcon />,
        name: "Homepage",
        subItems: [
          { name: "Hero content", path: "/admin/hero-content" },
          { name: "Klarna content", path: "/admin/klarna-content" },
          { name: "Recommended section", path: "/admin/recommended-section" },
          { name: "Expert section", path: "/admin/expert-section" },
          { name: "Occasion content", path: "/admin/occasion-content" },
          { name: "Country section", path: "/admin/country-section" },
          { name: "Header content", path: "/admin/header-content" },
          { name: "Footer content", path: "/admin/footer-content" },
          { name: "General content", path: "/admin/general-content" },
          { name: "FAQs", path: "/admin/faqs" },
        ],
      },
      {
        icon: <PageIcon />,
        name: "Get Visa page",
        subItems: [
          { name: "Slider content", path: "/admin/slider-content" },
          { name: "Process content", path: "/admin/process-content" },
          { name: "Comparison section", path: "/admin/comparison-section" },
          { name: "Visa pricing", path: "/admin/visa-pricing" },
          { name: "Visa countries", path: "/admin/visa-countries" },
          { name: "Appointment text", path: "/admin/appointment-text" },
        ],
      },
    ],
  },
  {
    title: "Users",
    items: [
      { icon: <UserCircleIcon />, name: "Customers", path: "/admin/users" },
      { icon: <UserCircleIcon />, name: "Team admins", path: "/admin/admins" },
      { icon: <UserCircleIcon />, name: "Roles", path: "/admin/roles" },
      { icon: <UserCircleIcon />, name: "Popup submissions", path: "/admin/popup-submissions" },
      { icon: <UserCircleIcon />, name: "Feedback", path: "/admin/feedback" },
    ],
  },
  {
    title: "Settings",
    items: [
      { icon: <PageIcon />, name: "Email templates", path: "/admin/email-templates" },
      { icon: <UserCircleIcon />, name: "Popup content", path: "/admin/popup-content" },
      { icon: <PageIcon />, name: "Site content", path: "/admin/content" },
      { icon: <PageIcon />, name: "Sent emails", path: "/admin/sent-emails" },
    ],
  },
];

const othersItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const can = useCan();

  const [openSubmenu, setOpenSubmenu] = useState<{
    sectionTitle: string;
    index: number;
  } | null>(null);

  const canSeePath = React.useCallback(
    (path: string) => {
      if (path.startsWith('/admin/applications')) return can('applications', 'read');
      if (path.startsWith('/admin/users')) return can('users', 'read');
      if (path.startsWith('/admin/admins')) return can('users', 'read');
      if (path.startsWith('/admin/appointment-text')) return can('siteContent', 'read');
      if (path.startsWith('/admin/faqs')) return can('siteContent', 'read');
      if (path.startsWith('/admin/country-section')) return can('siteContent', 'read');
      if (path.startsWith('/admin/comparison-section')) return can('siteContent', 'read');
      if (path.startsWith('/admin/visa-pricing')) return can('siteContent', 'read');
      if (path.startsWith('/admin/visa-countries')) return can('siteContent', 'read');
      if (path.startsWith('/admin/header-content')) return can('siteContent', 'read');
      if (path.startsWith('/admin/footer-content')) return can('siteContent', 'read');
      if (path.startsWith('/admin/slider-content')) return can('siteContent', 'read');
      if (path.startsWith('/admin/klarna-content')) return can('siteContent', 'read');
      if (path.startsWith('/admin/process-content')) return can('siteContent', 'read');
      if (path.startsWith('/admin/hero-content')) return can('siteContent', 'read');
      if (path.startsWith('/admin/general-content')) return can('siteContent', 'read');
      if (path.startsWith('/admin/content')) return can('siteContent', 'read');
      if (path.startsWith('/admin/sent-emails')) return can('siteContent', 'read');
      if (path.startsWith('/admin/email-templates')) return can('siteContent', 'read');
      if (path.startsWith('/admin/roles')) return can('roles', 'read');
      if (path.startsWith('/admin/popup-submissions')) return can('users', 'read');
      if (path.startsWith('/admin/feedback')) return can('users', 'read');
      if (path.startsWith('/admin/popup-content')) return can('users', 'read');
      if (path.startsWith('/admin/occasion-content')) return can('siteContent', 'read');
      if (path.startsWith('/admin/recommended-section')) return can('siteContent', 'read');
      if (path.startsWith('/admin/expert-section')) return can('siteContent', 'read');
      return true;
    },
    [can]
  );

  const canSeeNavItem = React.useCallback(
    (item: NavItem) => {
      if (item.subItems?.length) {
        return item.subItems.some((subItem) => canSeePath(subItem.path));
      }
      if (!item.path) return true;
      return canSeePath(item.path);
    },
    [canSeePath]
  );

  const filteredSections = React.useMemo(
    () =>
      navSections
        .map((section) => ({
          ...section,
          items: section.items
            .map((item) => {
              if (!item.subItems?.length) return item;
              const subItems = item.subItems.filter((subItem) =>
                canSeePath(subItem.path)
              );
              if (!subItems.length) return null;
              return { ...item, subItems };
            })
            .filter((item): item is NavItem => item !== null && canSeeNavItem(item)),
        }))
        .filter((section) => section.items.length > 0),
    [canSeeNavItem, canSeePath]
  );

  const isSubmenuOpen = (sectionTitle: string, index: number) =>
    openSubmenu?.sectionTitle === sectionTitle && openSubmenu?.index === index;

  const handleSubmenuToggle = (sectionTitle: string, index: number) => {
    setOpenSubmenu((prev) => {
      if (
        prev &&
        prev.sectionTitle === sectionTitle &&
        prev.index === index
      ) {
        return null;
      }
      return { sectionTitle, index };
    });
  };

  const isActive = useCallback(
    (path: string) => path === pathname,
    [pathname]
  );

  const renderMenuItems = (sectionItems: NavItem[], sectionTitle: string) => (
    <ul className="flex flex-col gap-4">
      {sectionItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              type="button"
              onClick={() => handleSubmenuToggle(sectionTitle, index)}
              className={`menu-item group  ${
                isSubmenuOpen(sectionTitle, index)
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  isSubmenuOpen(sectionTitle, index)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    isSubmenuOpen(sectionTitle, index)
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                isSubmenuOpen(sectionTitle, index)
                  ? "grid-rows-[1fr]"
                  : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.path}
                        className={`menu-dropdown-item ${
                          isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  // Auto-expand the submenu that contains the active route (pathname only).
  useEffect(() => {
    let matched: { sectionTitle: string; index: number } | null = null;

    filteredSections.forEach((section) => {
      section.items.forEach((nav, index) => {
        if (!nav.subItems) return;
        nav.subItems.forEach((subItem) => {
          if (subItem.path === pathname) {
            matched = { sectionTitle: section.title, index };
          }
        });
      });
    });

    othersItems.forEach((nav, index) => {
      if (!nav.subItems) return;
      nav.subItems.forEach((subItem) => {
        if (subItem.path === pathname) {
          matched = { sectionTitle: "others", index };
        }
      });
    });

    if (matched) {
      setOpenSubmenu(matched);
    }
  }, [pathname, filteredSections]);

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-6">
            {filteredSections.map((section) => (
              <div key={section.title}>
                <h2
                  className={`mb-3 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    section.title
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(section.items, section.title)}
              </div>
            ))}
          </div>
        </nav>
        {/* {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null} */}
      </div>
    </aside>
  );
};

export default AppSidebar;
