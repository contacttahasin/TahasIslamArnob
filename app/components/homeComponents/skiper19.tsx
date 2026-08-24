import ContactFormNoir from "../contact/ContactFormNoir";

/**
 * Home page's closing block — the same terminal intake the /contact page
 * uses, so both places ask for a brief the same way.
 */
const Skiper19 = () => {
  return (
    <section className="relative mx-auto flex w-full flex-col items-center overflow-hidden bg-gradient-to-br from-bg-secondary via-bg-elevated to-bg-elevated px-4 py-20 text-ink-secondary">
      <div className="mt-20 w-full">
        <ContactFormNoir />
      </div>
    </section>
  );
};

export { Skiper19 };
