import Form from "next/form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const SignOutForm = () => {
  return (
    <Form
      action={async () => {
        "use server";
        
        const supabase = await createClient();
        await supabase.auth.signOut();
        redirect("/auth");
      }}
      className="w-full"
    >
      <button
        className="w-full px-1 py-0.5 text-left text-red-500"
        type="submit"
      >
        Sign out
      </button>
    </Form>
  );
};
