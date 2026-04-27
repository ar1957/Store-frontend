"use client"

import { useState, useEffect } from "react"

interface EligibilityModalProps {
  productId: string
  productTitle: string
  clinicDomain: string
  onClose: () => void
  onApproved: (eligibilityData: Record<string, any>) => Promise<void>
}

interface FormData {
  state: string
  locationId: number | null
  dob: string
  sex: "male" | "female" | ""
  pregnancy: string
  hasMedicalConditions: boolean | null
  medicalConditions: string
  hasAllergies: boolean | null
  allergies: string
  currentMedications: string[]
  otherMedication: string
  heightFt: number
  heightIn: number
  weightLbs: number
  goalWeightLbs: number
}

const BLANK: FormData = {
  state: "", locationId: null,
  dob: "", sex: "",
  pregnancy: "",
  hasMedicalConditions: null, medicalConditions: "",
  hasAllergies: null, allergies: "",
  currentMedications: [], otherMedication: "",
  heightFt: 5, heightIn: 6, weightLbs: 0, goalWeightLbs: 0,
}

const GLP1_MEDS = [
  "Compound Semaglutide",
  "Tirzepatide",
  "Wegovy®",
  "Mounjaro",
  "Zepbound®",
  "Ozempic",
  "Other (please list any other medications)",
  "None",
]

const PREGNANCY_OPTIONS = [
  { value: "breastfeeding", label: "Currently breastfeeding" },
  { value: "pregnant", label: "Currently pregnant" },
  { value: "planning", label: "Planning to become pregnant" },
  { value: "none", label: "None of the above" },
]

const BMI_CATEGORIES = [
  { label: "Underweight", min: 0,    max: 18.5, color: "#0C447C", bg: "#B5D4F4", flex: 0.7 },
  { label: "Normal",      min: 18.5, max: 25,   color: "#27500A", bg: "#C0DD97", flex: 1.3 },
  { label: "Overweight",  min: 25,   max: 30,   color: "#633806", bg: "#FAC775", flex: 1.0 },
  { label: "Obese",       min: 30,   max: 40,   color: "#791F1F", bg: "#F7C1C1", flex: 1.5 },
  { label: "Severe",      min: 40,   max: 99,   color: "#501313", bg: "#F09595", flex: 0.5 },
]

const BMI_MIN = 10, BMI_MAX = 45

function calcBMI(ft: number, inches: number, lbs: number): number {
  const totalInches = ft * 12 + inches
  if (!totalInches || !lbs) return 0
  return (lbs / (totalInches * totalInches)) * 703
}

function getBMICategory(bmi: number) {
  return BMI_CATEGORIES.find(c => bmi < c.max) || BMI_CATEGORIES[BMI_CATEGORIES.length - 1]
}

function bmiToPercent(bmi: number): number {
  const clamped = Math.min(Math.max(bmi, BMI_MIN), BMI_MAX)
  return ((clamped - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 100
}

function healthyWeightRange(ft: number, inches: number) {
  const totalIn = ft * 12 + inches
  return {
    low: Math.round(18.5 * totalIn * totalIn / 703),
    high: Math.round(24.9 * totalIn * totalIn / 703),
  }
}

function BMIChart({ ft, inches, lbs, goalLbs }: { ft: number; inches: number; lbs: number; goalLbs: number }) {
  const bmi = calcBMI(ft, inches, lbs)
  if (bmi === 0) return null

  const cat = getBMICategory(bmi)
  const pct = bmiToPercent(bmi)
  const goalBmi = calcBMI(ft, inches, goalLbs)
  const goalPct = goalLbs > 0 ? bmiToPercent(goalBmi) : -1
  const goalCat = goalLbs > 0 ? getBMICategory(goalBmi) : null
  const { low, high } = healthyWeightRange(ft, inches)

  const toNormal = lbs > high
    ? `Lose ${Math.round(lbs - high)} lbs to reach healthy range`
    : lbs < low
    ? `Gain ${Math.round(low - lbs)} lbs to reach healthy range`
    : "You are in the healthy weight range"

  return (
    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>

      {/* BMI number + category */}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Your BMI</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: cat.color, lineHeight: 1.2 }}>{bmi.toFixed(1)}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: cat.color }}>{cat.label}</div>
        </div>
        <div style={{ flex: 1, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Healthy range</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111", lineHeight: 1.4 }}>{low}–{high} lbs</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>BMI 18.5 – 24.9</div>
        </div>
      </div>

      {/* Color bar with needle */}
      <div>
        {/* Category labels */}
        <div style={{ display: "flex", gap: 3, marginBottom: 3 }}>
          {BMI_CATEGORIES.map(c => (
            <div key={c.label} style={{
              flex: c.flex, fontSize: 9, textAlign: "center", padding: "3px 2px",
              borderRadius: 4, background: c.bg, color: c.color, fontWeight: 700,
            }}>{c.label}</div>
          ))}
        </div>

        {/* Color bar with needle */}
        <div style={{ position: "relative", height: 24, display: "flex", borderRadius: 6, overflow: "visible" }}>
          {/* Zones */}
          <div style={{ display: "flex", width: "100%", borderRadius: 6, overflow: "hidden" }}>
            {BMI_CATEGORIES.map(c => (
              <div key={c.label} style={{ flex: c.flex, background: c.bg }} />
            ))}
          </div>

          {/* Needle */}
          <div style={{
            position: "absolute",
            left: `${pct}%`,
            top: -6,
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 5,
            transition: "left 0.4s ease",
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: "50%",
              background: "#111", border: "2px solid #fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }} />
            <div style={{ width: 2, height: 20, background: "#111" }} />
          </div>

          {/* Goal weight star marker */}
          {goalPct >= 0 && (
            <div style={{
              position: "absolute",
              left: `${goalPct}%`,
              top: -10,
              transform: "translateX(-50%)",
              fontSize: 18,
              zIndex: 4,
              transition: "left 0.4s ease",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
            }}>⭐</div>
          )}
        </div>

        {/* Tick labels */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af", marginTop: 3, padding: "0 2px" }}>
          {["10", "18.5", "25", "30", "40", "45+"].map(t => <span key={t}>{t}</span>)}
        </div>
      </div>

      {/* Status message */}
      <div style={{
        fontSize: 12, textAlign: "center", padding: "8px 12px",
        borderRadius: 8, background: cat.bg + "55", color: cat.color, fontWeight: 600,
      }}>
        {toNormal}
      </div>
    </div>
  )
}

function getPublishableKey(): string {
  if (typeof window === "undefined") return process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  if ((window as any).__TENANT_API_KEY__) return (window as any).__TENANT_API_KEY__
  return process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
}

export default function EligibilityModal({
  productId, productTitle, clinicDomain, onClose, onApproved,
}: EligibilityModalProps) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(BLANK)
  const [states, setStates] = useState<{ state: string; customerLocationId: number }[]>([])
  const [loadingStates, setLoadingStates] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [blocked, setBlocked] = useState("")

  useEffect(() => {
    const key = getPublishableKey()
    fetch(`/api/eligibility-states?domain=${encodeURIComponent(clinicDomain)}`, {
      headers: {
        "x-publishable-api-key": key,
      },
    })
      .then(r => r.ok ? r.json() : { locations: [] })
      .then(data => {
        const seen = new Set()
        const unique = (data.locations || []).filter((l: any) => {
          if (seen.has(l.state)) return false
          seen.add(l.state)
          return true
        })
        setStates(unique)
      })
      .catch(() => setStates([]))
      .finally(() => setLoadingStates(false))
  }, [clinicDomain])

  const totalSteps = form.sex === "female" ? 7 : 6

  const back = () => {
    setError("")
    setStep(s => Math.max(1, s - 1))
  }

  const next = () => {
    setError("")

    if (step === 1) {
      if (!form.state) return setError("Please select your state")
      return setStep(2)
    }
    if (step === 2) {
      if (!form.dob) return setError("Please enter your date of birth")
      if (!form.sex) return setError("Please select your biological sex")
      return setStep(3)
    }
    if (step === 3 && form.sex === "female") {
      if (!form.pregnancy) return setError("Please select an option")
      return setStep(4)
    }

    const medicalStep = form.sex === "female" ? 4 : 3
    const allergyStep = form.sex === "female" ? 5 : 4
    const medicationsStep = form.sex === "female" ? 6 : 5

    if (step === medicalStep) {
      if (form.hasMedicalConditions === null) return setError("Please select an option")
      if (form.hasMedicalConditions && !form.medicalConditions.trim()) return setError("Please describe your medical conditions")
      return setStep(allergyStep)
    }
    if (step === allergyStep) {
      if (form.hasAllergies === null) return setError("Please select an option")
      if (form.hasAllergies && !form.allergies.trim()) return setError("Please describe your allergies")
      return setStep(medicationsStep)
    }
    if (step === medicationsStep) {
      if (!form.currentMedications.length) return setError("Please select at least one option")
      return setStep(totalSteps)
    }

    if (step === totalSteps) {
      if (!form.heightFt && form.heightFt !== 0) return setError("Please select your height")
      if (!form.weightLbs) return setError("Please enter your weight")
      if (!form.goalWeightLbs) return setError("Please enter your goal weight")

      const bmi = calcBMI(form.heightFt, form.heightIn, form.weightLbs)
      const meds = form.currentMedications
        .filter(m => m !== "Other (please list any other medications)")
        .join(", ")
      const allMeds = form.otherMedication ? `${meds}, ${form.otherMedication}` : meds

      setSubmitting(true)
      setError("")
      onApproved({
        domain: clinicDomain,
        productId,
        locationId: form.locationId,
        state: form.state,
        dob: form.dob,
        sex: form.sex,
        pregnancy: form.sex === "female" ? form.pregnancy : null,
        medicalHistory: form.hasMedicalConditions ? form.medicalConditions : "None",
        allergies: form.hasAllergies ? form.allergies : "None",
        currentMedications: allMeds || "None",
        heightFt: form.heightFt,
        heightIn: form.heightIn,
        weightLbs: form.weightLbs,
        goalWeightLbs: form.goalWeightLbs,
        bmi: Math.round(bmi * 10) / 10,
      }).catch(() => {
        setError("Something went wrong. Please try again.")
        setSubmitting(false)
      })
    }
  }

  const stepLabel = (form.sex === "female")
    ? ["State", "About You", "Pregnancy", "Medical History", "Allergies", "Medications", "Body Metrics"][step - 1]
    : ["State", "About You", "Medical History", "Allergies", "Medications", "Body Metrics"][step - 1]

  const medicalStep = form.sex === "female" ? 4 : 3
  const allergyStep = form.sex === "female" ? 5 : 4
  const medicationsStep = form.sex === "female" ? 6 : 5

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            {step > 1 && !blocked && (
              <button onClick={back} style={s.backBtn}>←</button>
            )}
          </div>
          <div style={s.headerCenter}>
            <div style={s.productName}>{productTitle}</div>
            <div style={s.stepLabel}>{blocked ? "Not Eligible" : `Step ${step} of ${totalSteps} — ${stepLabel}`}</div>
          </div>
          <button onClick={onClose} style={s.closeBtn}>×</button>
        </div>

        {/* Progress bar */}
        {!blocked && (
          <div style={s.progressBar}>
            <div style={{ ...s.progressFill, width: `${(step / totalSteps) * 100}%` }} />
          </div>
        )}

        {/* Content */}
        <div style={s.body}>

          {/* BLOCKED */}
          {blocked && (
            <div style={s.blockedBox}>
              <div style={s.blockedIcon}>⚕️</div>
              <p style={s.blockedText}>{blocked}</p>
              <button onClick={onClose} style={s.btnPrimary}>Close</button>
            </div>
          )}

          {/* STEP 1 — State */}
          {!blocked && step === 1 && (
            <div style={s.stepWrap}>
              <h2 style={s.question}>What state do you live in?</h2>
              <p style={s.subtitle}>We can only provide service in states where our clinic is licensed.</p>
              {loadingStates ? (
                <div style={s.loading}>Loading available states…</div>
              ) : states.length === 0 ? (
                <div>
                  <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
                    Please enter your state to continue.
                  </p>
                  <input
                    style={s.input}
                    placeholder="e.g. California"
                    value={form.state}
                    onChange={e => setForm(p => ({ ...p, state: e.target.value, locationId: 0 }))}
                  />
                </div>
              ) : (
                <div style={s.stateGrid}>
                  {states.map(l => (
                    <button
                      key={`${l.state}-${l.customerLocationId}`}
                      onClick={() => {
                        setForm(p => ({ ...p, state: l.state, locationId: l.customerLocationId }))
                        setError("")
                        setTimeout(() => setStep(2), 120)
                      }}
                      style={{
                        ...s.stateBtn,
                        ...(form.state === l.state ? s.stateBtnActive : {}),
                      }}>
                      {l.state}
                    </button>
                  ))}
                </div>
              )}
              {error && <div style={s.errorMsg}>{error}</div>}
            </div>
          )}

          {/* STEP 2 — DOB + Sex */}
          {!blocked && step === 2 && (
            <div style={s.stepWrap}>
              <h2 style={s.question}>Tell us about yourself</h2>
              <div style={s.fieldGroup}>
                <label style={s.label}>Date of Birth</label>
                <input type="date" style={s.input}
                  value={form.dob}
                  min={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 100); return d.toISOString().split("T")[0] })()}
                  max={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 15); return d.toISOString().split("T")[0] })()}
                  onChange={e => setForm(p => ({ ...p, dob: e.target.value }))} />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Biological Sex</label>
                <div style={s.btnRow}>
                  {["male", "female"].map(sex => (
                    <button key={sex} onClick={() => setForm(p => ({ ...p, sex: sex as "male" | "female" }))}
                      style={{ ...s.optionBtn, ...(form.sex === sex ? s.optionBtnActive : {}) }}>
                      {sex.charAt(0).toUpperCase() + sex.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Pregnancy (female only) */}
          {!blocked && step === 3 && form.sex === "female" && (
            <div style={s.stepWrap}>
              <h2 style={s.question}>Are you currently pregnant, breastfeeding, or planning to become pregnant?</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                {PREGNANCY_OPTIONS.map(opt => (
                  <button key={opt.value}
                    onClick={() => {
                      setForm(p => ({ ...p, pregnancy: opt.value }))
                      if (opt.value !== "none") {
                        setBlocked("GLP-1s are not recommended for women who are pregnant or breastfeeding. We recommend discussing your concern regarding potential weight loss treatment and guidance on weight management with your OB-GYN or primary healthcare provider.")
                      } else {
                        setTimeout(() => setStep(4), 120)
                      }
                    }}
                    style={{ ...s.optionBtn, ...(form.pregnancy === opt.value ? s.optionBtnActive : {}) }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Medical History */}
          {!blocked && step === medicalStep && (
            <div style={s.stepWrap}>
              <h2 style={s.question}>Do you have any medical condition(s), a history of prior surgeries, or anything else you want to tell your doctor?</h2>
              <div style={s.btnRow}>
                <button
                  onClick={() => {
                    setForm(p => ({ ...p, hasMedicalConditions: false }))
                    setTimeout(() => setStep(allergyStep), 120)
                  }}
                  style={{ ...s.optionBtn, ...(form.hasMedicalConditions === false ? s.optionBtnActive : {}) }}>
                  No
                </button>
                <button
                  onClick={() => setForm(p => ({ ...p, hasMedicalConditions: true }))}
                  style={{ ...s.optionBtn, ...(form.hasMedicalConditions === true ? s.optionBtnActive : {}) }}>
                  Yes
                </button>
              </div>
              {form.hasMedicalConditions && (
                <div style={s.fieldGroup}>
                  <label style={s.label}>Please list your medical condition(s), any prior surgeries, or other message to your doctor.</label>
                  <textarea style={s.textarea} rows={4}
                    placeholder="Leave a Description"
                    value={form.medicalConditions}
                    onChange={e => setForm(p => ({ ...p, medicalConditions: e.target.value }))} />
                </div>
              )}
            </div>
          )}

          {/* Allergies */}
          {!blocked && step === allergyStep && (
            <div style={s.stepWrap}>
              <h2 style={s.question}>Do you have any allergies?</h2>
              <p style={s.subtitle}>Include any allergies to food, dyes, prescription or over-the-counter medicines, herbs, vitamins, or supplements.</p>
              <div style={s.btnRow}>
                <button
                  onClick={() => {
                    setForm(p => ({ ...p, hasAllergies: false }))
                    setTimeout(() => setStep(medicationsStep), 120)
                  }}
                  style={{ ...s.optionBtn, ...(form.hasAllergies === false ? s.optionBtnActive : {}) }}>
                  No
                </button>
                <button
                  onClick={() => setForm(p => ({ ...p, hasAllergies: true }))}
                  style={{ ...s.optionBtn, ...(form.hasAllergies === true ? s.optionBtnActive : {}) }}>
                  Yes
                </button>
              </div>
              {form.hasAllergies && (
                <div style={s.fieldGroup}>
                  <label style={s.label}>Please list what you are allergic to and the reaction each allergy causes.</label>
                  <textarea style={s.textarea} rows={4}
                    placeholder="Leave a Description"
                    value={form.allergies}
                    onChange={e => setForm(p => ({ ...p, allergies: e.target.value }))} />
                </div>
              )}
            </div>
          )}

          {/* Medications */}
          {!blocked && step === medicationsStep && (
            <div style={s.stepWrap}>
              <h2 style={s.question}>Please select any medications you are currently taking for weight loss, in addition list all the medications you are taking under other:</h2>
              <div style={{ display: "flex", flexDirection: "column", marginTop: 12 }}>
                {GLP1_MEDS.map(med => {
                  const checked = form.currentMedications.includes(med)
                  return (
                    <label key={med} style={s.checkLabel}>
                      <input type="checkbox" checked={checked}
                        onChange={() => {
                          if (med === "None") {
                            setForm(p => ({ ...p, currentMedications: checked ? [] : ["None"] }))
                          } else {
                            setForm(p => ({
                              ...p,
                              currentMedications: checked
                                ? p.currentMedications.filter(m => m !== med)
                                : [...p.currentMedications.filter(m => m !== "None"), med]
                            }))
                          }
                        }}
                        style={s.checkbox} />
                      <span>{med}</span>
                    </label>
                  )
                })}
              </div>
              {form.currentMedications.includes("Other (please list any other medications)") && (
                <textarea style={{ ...s.textarea, marginTop: 10 }} rows={3}
                  placeholder="Please list your other medications…"
                  value={form.otherMedication}
                  onChange={e => setForm(p => ({ ...p, otherMedication: e.target.value }))} />
              )}
            </div>
          )}

          {/* BMI step — last step */}
          {!blocked && step === totalSteps && (
            <div style={s.stepWrap}>
              <h2 style={s.question}>Ok, let's talk about numbers.</h2>

              <div style={s.fieldGroup}>
                <label style={s.label}>How tall are you?</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <select style={{ ...s.select, flex: 1 }} value={form.heightFt}
                    onChange={e => setForm(p => ({ ...p, heightFt: Number(e.target.value) }))}>
                    {[4,5,6,7].map(f => <option key={f} value={f}>{f} ft</option>)}
                  </select>
                  <select style={{ ...s.select, flex: 1 }} value={form.heightIn}
                    onChange={e => setForm(p => ({ ...p, heightIn: Number(e.target.value) }))}>
                    {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => <option key={i} value={i}>{i} in</option>)}
                  </select>
                </div>
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>How much do you weigh? (lbs)</label>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 6px" }}>
                  This helps us calculate your BMI. BMI is one factor used to determine your weight care path — please be as accurate as possible.
                </p>
                <input type="number" style={s.input} placeholder="e.g. 200"
                  value={form.weightLbs || ""}
                  onChange={e => setForm(p => ({ ...p, weightLbs: Number(e.target.value) }))} />
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>What is your goal weight? (lbs)</label>
                <input type="number" style={s.input} placeholder="e.g. 160"
                  value={form.goalWeightLbs || ""}
                  onChange={e => setForm(p => ({ ...p, goalWeightLbs: Number(e.target.value) }))} />
              </div>

              {/* BMI Chart — appears as soon as weight is entered */}
              {form.weightLbs > 0 && (
                <BMIChart ft={form.heightFt} inches={form.heightIn} lbs={form.weightLbs} goalLbs={form.goalWeightLbs} />
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        {!blocked && step !== 1 && !(step === 3 && form.sex === "female") && (
          <div style={s.footer}>
            {error && <div style={s.errorMsg}>{error}</div>}
            <button onClick={next} disabled={submitting} style={s.btnPrimary}>
              {submitting ? "Submitting…" : step === totalSteps ? "Submit & Continue to View Cart" : "Continue"}
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {submitting && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: 16,
            background: "rgba(255,255,255,0.92)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 16, zIndex: 10,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              border: "4px solid #e5e7eb",
              borderTopColor: "var(--color-primary, #111)",
              animation: "mhc-modal-spin 0.8s linear infinite",
            }} />
            <style>{`@keyframes mhc-modal-spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#111" }}>Adding to cart…</div>
            <div style={{ fontSize: 13, color: "#6b7280", textAlign: "center", maxWidth: 240 }}>
              Please wait while we prepare your cart.
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 },
  modal: { background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f3f4f6" },
  headerLeft: { width: 36 },
  headerCenter: { textAlign: "center", flex: 1 },
  productName: { fontSize: 13, fontWeight: 700, color: "#111" },
  stepLabel: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  backBtn: { width: 32, height: 32, borderRadius: "50%", border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" },
  closeBtn: { width: 32, height: 32, borderRadius: "50%", border: "none", background: "none", cursor: "pointer", fontSize: 20, color: "#9ca3af" },
  progressBar: { height: 3, background: "#f3f4f6" },
  progressFill: { height: "100%", background: "var(--color-primary, #C9A84C)", transition: "width 0.3s ease" },
  body: { flex: 1, overflowY: "auto", padding: "24px 28px" },
  footer: { padding: "16px 28px", borderTop: "1px solid #f3f4f6", background: "#fff" },
  stepWrap: { display: "flex", flexDirection: "column", gap: 16 },
  question: { fontSize: 20, fontWeight: 700, color: "#111", margin: 0, lineHeight: 1.3, textAlign: "center" },
  subtitle: { fontSize: 13, color: "#6b7280", margin: 0, textAlign: "center" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", padding: "12px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 15, color: "#111", outline: "none", boxSizing: "border-box" },
  select: { width: "100%", padding: "12px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 15, color: "#111", background: "#fff", outline: "none", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "12px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14, color: "#111", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" },
  btnRow: { display: "flex", gap: 10 },
  optionBtn: { flex: 1, padding: "14px 20px", borderRadius: 16, border: "2px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", color: "#374151" },
  optionBtnActive: { border: "2px solid var(--color-primary, #C9A84C)", background: "var(--color-primary, #C9A84C)", color: "var(--button-text, #fff)", fontWeight: 700 },
  stateGrid: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 },
  stateBtn: { padding: "10px 18px", borderRadius: 20, border: "2px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", color: "#374151" },
  stateBtnActive: { border: "2px solid var(--color-primary, #C9A84C)", background: "var(--color-primary, #C9A84C)", color: "var(--button-text, #fff)", fontWeight: 700 },
  checkLabel: { display: "flex", alignItems: "center", gap: 12, padding: "8px 4px", fontSize: 14, color: "#374151", cursor: "pointer" },
  checkbox: { width: 18, height: 18, accentColor: "var(--color-primary, #C9A84C)" as any, flexShrink: 0, cursor: "pointer" },
  btnPrimary: { width: "100%", padding: "14px", borderRadius: 16, border: "none", background: "var(--color-primary, #C9A84C)", color: "var(--button-text, #fff)", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  errorMsg: { color: "#dc2626", fontSize: 13, marginBottom: 10, textAlign: "center" },
  loading: { textAlign: "center", color: "#9ca3af", padding: 24 },
  blockedBox: { textAlign: "center", padding: "16px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 },
  blockedIcon: { fontSize: 48 },
  blockedText: { fontSize: 14, color: "#374151", lineHeight: 1.6, maxWidth: 380, margin: 0 },
}
