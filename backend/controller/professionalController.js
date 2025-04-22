import professionals from "../models/professionalprofilemodel.js";

export function getprofessionals(req, res) {
  professionals.find().then(
    (data) => {
        res.status(200).json(data);
  });     
}

export function Saveprofessional (req, res){    
    const professional = new professionals({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
        image: req.body.image,
        createdAt: req.body.createdAt,
    });
    professional.save()
        .then(() => {
            res.status(201).json({ message: 'professional created successfully' });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: 'Failed to create professional' });
        }   );
}