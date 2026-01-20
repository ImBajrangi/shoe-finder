import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-neutral-900 group-[.toaster]:text-neutral-100 group-[.toaster]:border-neutral-800 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-neutral-400",
          actionButton:
            "group-[.toast]:bg-white group-[.toast]:text-black",
          cancelButton:
            "group-[.toast]:bg-neutral-800 group-[.toast]:text-neutral-300",
          success: "group-[.toaster]:border-emerald-500/30",
          error: "group-[.toaster]:border-red-500/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
