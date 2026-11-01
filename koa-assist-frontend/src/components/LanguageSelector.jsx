import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";

const languages = [
  {
    code: "en",
    name: "English",
  },
  {
    code: "hi",
    name: "हिन्दी",
  },
  {
    code: "as",
    name: "অসমীয়া",
  },
];

function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  const [open, setOpen] = useState(false);
  const selectorRef = useRef(null);

  const selectedLanguage =
    languages.find((item) => item.code === language) ||
    languages[0];

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const handleLanguageChange = (code) => {
    setLanguage(code);
    setOpen(false);
  };

  return (
    <div
      className="language-selector"
      ref={selectorRef}
    >
      <button
        type="button"
        className={`language-selector-button ${
          open
            ? "language-selector-button-open"
            : ""
        }`}
        onClick={() =>
          setOpen((current) => !current)
        }
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("language.label")}
      >
        <Globe2 size={17} />

        <span>
          {selectedLanguage.name}
        </span>

        <ChevronDown
          size={15}
          className={`language-chevron ${
            open
              ? "language-chevron-open"
              : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="language-menu"
          role="menu"
        >
          <div className="language-menu-header">
            <span>
              {t("language.label")}
            </span>
          </div>

          <div className="language-options">
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                className={`language-option ${
                  language === item.code
                    ? "language-option-active"
                    : ""
                }`}
                onClick={() =>
                  handleLanguageChange(item.code)
                }
                role="menuitem"
                aria-current={
                  language === item.code
                    ? "true"
                    : undefined
                }
              >
                <span>
                  {item.name}
                </span>

                {language === item.code && (
                  <Check size={16} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;