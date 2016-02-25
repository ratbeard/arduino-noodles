// This class will correctly work because it inherits from
// NSObject and thus automatically can be used by Objective-C.
// It does not use any Swift specific features.
//
class OkExample: NSObject {

    override init() {
        super.init()
        NSNotificationCenter.defaultCenter().addObserver(self, selector: "handler:", name: "MyNotification", object: nil)
    }

    func handler(notif: NSNotification) {
        println("MyNotification was handled")
    }
}
