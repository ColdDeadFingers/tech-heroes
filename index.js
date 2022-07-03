const Joi = require('joi');
const express = require('express');
const app = express();

app.use(express.json());

app.post('/split-payments/compute', (req, res) =>{
    const schema = Joi.object({
        ID: Joi.number().integer().required(),
        Amount: Joi.number().integer().min(0).required(),
        Currency: Joi.string().required(),
        CustomerEmail: Joi.string().email().required(),
        SplitInfo: Joi.array().min(1).max(20).required()
    });

    const validation = schema.validate(req.body);
    if(validation.error) {
        res.status(400).send(validation.error.details[0].message)
    }
   

    const transaction = {
        ID: req.body.ID,
        Amount: req.body.Amount,
        Currency: req.body.Currency,
        CustomerEmail: req.body.CustomerEmail,
        SplitInfo: req.body.SplitInfo
    }

    let Totalratio = 0;
    let Balance = req.body.Amount;
    let SplitBreakdown = []
    const compute = (transaction) => {
    
        let length = transaction.SplitInfo.length;
        for(i = 0; i < length; i++){
            if (transaction.SplitInfo[i].SplitType == "FLAT"){
                Balance = Balance - transaction.SplitInfo[i].SplitValue 
                SplitBreakdown.push({SplitEntityId: transaction.SplitInfo[i].SplitEntityId, Amount: transaction.SplitInfo[i].SplitValue})
            }
        }
        for(i = 0; i < length; i++){
            if (transaction.SplitInfo[i].SplitType == "PERCENTAGE"){    
                Balance = Balance - ((transaction.SplitInfo[i].SplitValue/100) * Balance) 
                SplitBreakdown.push({SplitEntityId: transaction.SplitInfo[i].SplitEntityId, Amount: ((transaction.SplitInfo[i].SplitValue/100) * Balance)})
                
            }
        }
        for(i = 0; i < length; i++){
            if (transaction.SplitInfo[i].SplitType == "RATIO"){
                Totalratio += transaction.SplitInfo[i].SplitValue
            }
        }
    
        let RatioBalance = Balance
        
        for(i = 0; i < length; i++){
            if (transaction.SplitInfo[i].SplitType == "RATIO"){   
            Balance = Balance - ((transaction.SplitInfo[i].SplitValue / Totalratio) * RatioBalance)
            SplitBreakdown.push({SplitEntityId: transaction.SplitInfo[i].SplitEntityId, Amount: ((transaction.SplitInfo[i].SplitValue/Totalratio) * RatioBalance)})
            }
        }

        if(Balance < 0) {
            res.status(400).send("Balance can not be less than 0")
        }
    }

    compute(transaction)

    res.send({
        ID : req.body.ID,
        Balance: Balance,
        SplitBreakdown: SplitBreakdown
    });
})

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});