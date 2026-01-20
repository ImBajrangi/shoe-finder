import * as React from "react";
import { createContext, useContext, useState } from "react";
import { cva } from "class-variance-authority";
import { motion } from "motion/react";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const SidebarContext = createContext({ collapsed: false, setCollapsed: () => {} });

export const useSidebar = () => useContext(SidebarContext);

const SidebarProvider = ({ children, defaultCollapsed = false }) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};

const Sidebar = React.forwardRef(({ className, children, ...props }, ref) => {
  const { collapsed } = useSidebar();

  return (
    <motion.aside
      ref={ref}
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ type: "spring", duration: 0.3, bounce: 0 }}
      className={cn(
        "flex h-full flex-col",
        "border-r border-neutral-800 bg-neutral-900",
        "overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </motion.aside>
  );
});
Sidebar.displayName = "Sidebar";

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => {
  const { collapsed } = useSidebar();

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-14 items-center border-b border-neutral-800",
        collapsed ? "justify-center px-2" : "px-6",
        className
      )}
      {...props}
    />
  );
});
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-auto px-3 py-4", className)}
    {...props}
  />
));
SidebarContent.displayName = "SidebarContent";

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => {
  const { collapsed } = useSidebar();

  return (
    <div
      ref={ref}
      className={cn(
        "border-t border-neutral-800 py-4",
        collapsed ? "px-2" : "px-6",
        className
      )}
      {...props}
    />
  );
});
SidebarFooter.displayName = "SidebarFooter";

const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("py-2", className)} {...props} />
));
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef(({ className, children, ...props }, ref) => {
  const { collapsed } = useSidebar();

  if (collapsed) return null;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "px-3 py-1.5 text-xs font-semibold",
        "uppercase tracking-wider text-neutral-500",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const sidebarItemVariants = cva(
  "flex cursor-pointer items-center rounded-lg text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "text-neutral-400 hover:bg-neutral-800 hover:text-white",
        active: "bg-white text-black hover:bg-neutral-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const SidebarItem = React.forwardRef(
  ({ className, variant, icon: Icon, children, ...props }, ref) => {
    const { collapsed } = useSidebar();

    return (
      <div
        ref={ref}
        className={cn(
          sidebarItemVariants({ variant }),
          collapsed ? "justify-center p-2" : "gap-3 px-3 py-2",
          className
        )}
        {...props}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="overflow-hidden whitespace-nowrap"
          >
            {children}
          </motion.span>
        )}
      </div>
    );
  }
);
SidebarItem.displayName = "SidebarItem";

const SidebarToggle = React.forwardRef(({ className, ...props }, ref) => {
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <button
      ref={ref}
      onClick={() => setCollapsed(!collapsed)}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg",
        "text-neutral-400 transition-colors",
        "hover:bg-neutral-800 hover:text-white",
        "cursor-pointer",
        className
      )}
      {...props}
    >
      {collapsed ? (
        <PanelLeft className="h-4 w-4" />
      ) : (
        <PanelLeftClose className="h-4 w-4" />
      )}
    </button>
  );
});
SidebarToggle.displayName = "SidebarToggle";

export {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarItem,
  SidebarToggle,
};
