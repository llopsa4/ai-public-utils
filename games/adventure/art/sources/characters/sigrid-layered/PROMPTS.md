# Sigrid Phase 2 prompt set

Built-in `image_gen.imagegen`, transparent background enabled. Approved directional
master attached to each pose as identity/style reference. User revisions override
the blonde hair and sheathed hip sword in the older generated briefs.

Shared constraints: athletic woman35; long loose untied chestnut hair; grey eyes;
dark-blue mid-thigh split double-button winter officer coat, snowy short fur collar,
chipped ivory ceramic shoulder/chest/rib/forearm protections with brass repairs,
black gloves, grey breeches and tall black riding boots. Detailed crisp pixel
illustration and worn industrial-fantasy materials, neutral form shading. Complete
figure inside canvas; transparent background, no text/halo/ground shadow/backdrop.
Same anatomy scale as master; 1024×1536 except lying 1536×1024.

Directional rule: right-facing art shows the cheek scar and compact retracted hilt
at near rear hip; left-facing art shows the actual opposite physical side, unscarred
visible cheek, with hilt occluded by body/coat. Never mirror hilt/scar to the wrong
side. Hilt stays on belt, no blade/scabbard/shield.

- Kneel, one call per direction: one knee down, other foot planted, looking at low
  tracks, hand near belt/raised knee. Maintain adult anatomy scale, floor near1500.
- Lie, one call per direction: lying on back, closed eyes, arms beside torso, hair
  spread safely within canvas, body near lower edge floor990. Head right for right
  direction, head left for opposite side. The first opposite-side narrow strip was
  rejected; repeat used the correct right lying canvas as a layout/scale reference.
- Walk contact, one call per direction: upright measured confident soldier stride,
  forward heel just touches, rear toe lifts, square shoulders, restrained opposite
  arm swing, two arms/legs visible, hilt clear of swinging limbs on visible side.
- Walk passing, one call per direction: straight supporting leg under hip, other
  knee bent/foot lifted passing supporting calf, upright measured soldier gait.
- Opposite-side idle: true left-facing slight three-quarter view toward viewer,
  both eyes visible, composed closed mouth, even weight, relaxed arms; no visible
  hilt/scar on this side. Existing right idle is the other reference for outfit/scale.
- Detached hidden arm helper: one complete hanging arm, shoulder to fingertips,
  ivory shoulder pauldron, blue sleeve, ceramic bracer, black glove, complete hidden
  contours, rounded overlap at shoulder/elbow; no other body/props.
- Detached hidden leg helper: one complete neutral right-facing leg, grey breeches,
  tall worn black riding boot with cuff, full upper thigh normally hidden by coat,
  rounded joint overlap; no torso/coat/hilt/other limbs.

Deterministic source-coordinate cutting, helper registration, alpha normalization
and baseline placement are in `prepare-pack.py`; original generated images remain
in `generated-originals/`.
