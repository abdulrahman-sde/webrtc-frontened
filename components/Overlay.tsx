export default function Overlay({ email }: { email: string | null }) {
  return (
    <div className="absolute bottom-0 inset-x-0 h-12 bg-white/5 backdrop-blur-md border-t border-white/10 flex items-center px-4 justify-between">
      <span className="text-[12px] text-white/80 font-medium">{email}</span>
    </div>
  );
}
